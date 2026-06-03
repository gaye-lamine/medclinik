import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';

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
    return this.prisma.stockItem.findMany({
      where: {
        quantity: { lte: this.prisma.stockItem.fields.criticalThreshold },
      },
      orderBy: { quantity: 'asc' },
    });
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
    if (rx.isDelivered) throw new BadRequestException('Cette ordonnance a déjà été délivrée.');

    // 1. Mark as delivered in database
    await this.prisma.prescription.update({
      where: { id },
      data: { isDelivered: true },
    });

    // 2. Parse medicines and deduct stock
    const meds = rx.medicines as any[];
    let matchedCount = 0;
    
    for (const med of meds) {
      // Find matching item in stock
      const stockItem = await this.prisma.stockItem.findFirst({
        where: {
          name: {
            contains: med.name.split(' ')[0], // match on first word (e.g. Paracétamol)
            mode: 'insensitive',
          },
        },
      });

      if (stockItem) {
        matchedCount++;
        // Deduct 1 unit by default
        const quantityToDeduct = 1;
        await this.prisma.stockItem.update({
          where: { id: stockItem.id },
          data: {
            quantity: Math.max(0, stockItem.quantity - quantityToDeduct),
          },
        });
      }
    }

    // 3. Create billing record for medicines (ex: 3000 FCFA per medicine)
    const pricePerMed = 3000;
    const totalAmount = meds.length * pricePerMed;
    const patient = rx.consultation.patient;
    const coverage = patient.insuranceCoverageShare || 0;
    const insuranceShare = (totalAmount * coverage) / 100;
    const patientShare = totalAmount - insuranceShare;

    await this.prisma.billing.create({
      data: {
        patientId: patient.id,
        amount: totalAmount,
        status: 'PAID',
        paymentMethod: 'WAVE',
        transactionId: `RX-DELIV-${rx.uniqueCode}`,
        mutuelleName: patient.mutuelleName,
        insuranceCoverageShare: coverage,
        patientShare,
        insuranceShare,
      },
    });

    this.queueGateway.broadcastQueueUpdate();
    return {
      success: true,
      deliveredMedicines: meds.length,
      stockItemsDeducted: matchedCount,
      totalBilling: totalAmount,
    };
  }
}
