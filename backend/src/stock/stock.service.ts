import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { InventoryException } from '../common/exceptions/inventory.exception';

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
    return rx;
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

    // 1. Pré-vérification de la disponibilité de TOUS les articles en stock avant toute modification
    const stockDeductions: Array<{ stockItem: any; quantityToDeduct: number }> = [];

    for (const med of meds) {
      let stockItem: any = null;

      // Priorité 1 : Recherche par ID d'article de stock explicite s'il existe dans le JSON
      if (med.stockItemId) {
        stockItem = await this.prisma.stockItem.findUnique({ where: { id: med.stockItemId } });
      }

      // Priorité 2 : Recherche par correspondance du nom exact ou premier mot
      if (!stockItem && med.name) {
        stockItem = await this.prisma.stockItem.findFirst({
          where: {
            name: {
              contains: med.name.split(' ')[0],
              mode: 'insensitive',
            },
          },
        });
      }

      if (!stockItem) {
        throw new NotFoundException(`Médicament "${med.name}" introuvable dans l'inventaire de la pharmacie.`);
      }

      // Quantité requise : lue du champ explicit `quantity` ou calculée par défaut à 1
      const quantityToDeduct = med.quantity ? parseFloat(med.quantity) : 1;

      // Contrôle de rupture de stock : Bloquer la délivrance si quantité insuffisante
      if (stockItem.quantity < quantityToDeduct) {
        throw new InventoryException(
          `Stock insuffisant pour "${stockItem.name}". Quantité disponible : ${stockItem.quantity}, requise : ${quantityToDeduct}.`,
          'INVENTORY_INSUFFICIENT_STOCK',
        );
      }

      stockDeductions.push({ stockItem, quantityToDeduct });
    }

    // 2. Calcul du montant total de l'ordonnance et ventilation de la prise en charge
    const pricePerMed = 3000;
    const totalAmount = meds.length * pricePerMed;
    const patient = rx.consultation.patient;
    const coverage = patient.insuranceCoverageShare || 0;
    const insuranceShare = (totalAmount * coverage) / 100;
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
