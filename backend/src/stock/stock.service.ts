import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { InventoryException } from '../common/exceptions/inventory.exception';
import { matchMedicineToStock } from '../utils/stock-matching.utils';

@Injectable()
export class StockService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async findAll() {
    return this.prisma.stockItem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAlerts() {
    const items = await this.prisma.stockItem.findMany({
      orderBy: { quantity: 'asc' },
    });
    return items.filter((item) => item.quantity <= item.criticalThreshold);
  }

  async create(data: any) {
    return this.prisma.stockItem.create({
      data: {
        name: data.name,
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        criticalThreshold: parseFloat(data.criticalThreshold),
        category: data.category,
      },
    });
  }

  async update(id: string, data: any) {
    const item = await this.prisma.stockItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Article en stock introuvable');

    return this.prisma.stockItem.update({
      where: { id },
      data: {
        quantity: data.quantity !== undefined ? parseFloat(data.quantity) : undefined,
        criticalThreshold: data.criticalThreshold !== undefined ? parseFloat(data.criticalThreshold) : undefined,
      },
    });
  }

  async findPrescriptionByCode(code: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { uniqueCode: code.trim().toUpperCase() },
      include: {
        consultation: {
          include: {
            patient: true,
            doctor: { select: { name: true } },
          },
        },
      },
    });
    if (!rx) {
      throw new NotFoundException('Ordonnance introuvable avec ce code RX.');
    }

    const meds = (rx.medicines as any[]) || [];
    const stockItems = await this.prisma.stockItem.findMany();

    const medicinesWithStock = meds.map((med) => {
      const match = matchMedicineToStock(med, stockItems);
      return {
        ...med,
        stockStatus: match.stockStatus,
        stockItemName: match.stockItem ? match.stockItem.name : null,
        availableQuantity: match.availableQuantity,
        requiredQuantity: match.requiredQuantity,
      };
    });

    const isFullyInStock = medicinesWithStock.length > 0 && medicinesWithStock.every((m) => m.stockStatus === 'AVAILABLE');

    return {
      ...rx,
      medicines: medicinesWithStock,
      isFullyInStock,
    };
  }

  async deliverPrescription(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        consultation: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!rx) throw new NotFoundException('Ordonnance introuvable');
    if (rx.isDelivered) throw new InventoryException('Cette ordonnance a déjà été délivrée.', 'INVENTORY_ALREADY_DELIVERED');

    const meds = (rx.medicines as any[]) || [];
    if (meds.length === 0) {
      throw new BadRequestException('Cette ordonnance ne contient aucun médicament.');
    }

    const stockItems = await this.prisma.stockItem.findMany();

    // 1. Pré-vérification de la disponibilité de TOUS les articles via l'utilitaire partagé matchMedicineToStock
    const stockDeductions: Array<{ stockItem: any; quantityToDeduct: number }> = [];

    for (const med of meds) {
      const match = matchMedicineToStock(med, stockItems);

      if (!match.stockItem) {
        throw new NotFoundException(`Médicament "${med.name}" introuvable dans l'inventaire de la pharmacie.`);
      }

      if (match.stockStatus === 'INSUFFICIENT_STOCK') {
        throw new InventoryException(
          `Stock insuffisant pour "${match.stockItem.name}". Quantité disponible : ${match.availableQuantity}, requise : ${match.requiredQuantity}.`,
          'INVENTORY_INSUFFICIENT_STOCK',
        );
      }

      stockDeductions.push({ stockItem: match.stockItem, quantityToDeduct: match.requiredQuantity });
    }

    // 2. Calcul du montant total de l'ordonnance et ventilation de la prise en charge
    const pricePerMed = 3000;
    const totalAmount = meds.length * pricePerMed;
    const patient = rx.consultation.patient;
    const coverage = patient.insuranceCoverageShare || 0;
    const insuranceShare = Math.round((totalAmount * coverage) / 100);
    const patientShare = totalAmount - insuranceShare;

    // 3. Exécution atomique via une transaction Prisma ($transaction)
    const result = await this.prisma.$transaction(async (tx) => {
      // a) Marquer l'ordonnance comme délivrée
      await tx.prescription.update({
        where: { id },
        data: { isDelivered: true },
      });

      // b) Déduire les quantités exactes en stock
      for (const item of stockDeductions) {
        await tx.stockItem.update({
          where: { id: item.stockItem.id },
          data: {
            quantity: item.stockItem.quantity - item.quantityToDeduct,
          },
        });
      }

      // c) Créer la facture de pharmacie en statut UNPAID (à régler via la caisse)
      const bill = await tx.billing.create({
        data: {
          patientId: patient.id,
          amount: totalAmount,
          amountPaid: 0,
          status: 'UNPAID',
          mutuelleName: patient.mutuelleName,
          insuranceCoverageShare: coverage,
          patientShare,
          insuranceShare,
          transactionId: `RX-${rx.uniqueCode}`,
        },
      });

      return { bill, deductedCount: stockDeductions.length };
    });

    this.queueGateway.broadcastQueueUpdate();
    return {
      success: true,
      deliveredMedicines: meds.length,
      stockItemsDeducted: result.deductedCount,
      billingId: result.bill.id,
      totalBilling: totalAmount,
      patientShare,
      status: 'UNPAID',
    };
  }
}
