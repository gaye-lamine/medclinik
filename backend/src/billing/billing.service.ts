import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { BillingStatus, ConsultationStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async findAll() {
    return this.prisma.billing.findMany({
      include: { patient: true, cashier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.billing.findUnique({
      where: { id },
      include: { patient: true, cashier: { select: { name: true } } },
    });
  }

  async calculateShare(patientId: string, amount: number) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const coverage = patient.insuranceCoverageShare || 0;
    const insuranceShare = (amount * coverage) / 100;
    const patientShare = amount - insuranceShare;

    return {
      amount,
      mutuelleName: patient.mutuelleName,
      insuranceCoverageShare: coverage,
      patientShare,
      insuranceShare,
    };
  }

  async create(data: any) {
    const { patientId, amount, doctorId, specialty } = data;
    const share = await this.calculateShare(patientId, amount);

    const bill = await this.prisma.billing.create({
      data: {
        patientId,
        amount,
        status: BillingStatus.UNPAID,
        mutuelleName: share.mutuelleName,
        insuranceCoverageShare: share.insuranceCoverageShare,
        patientShare: share.patientShare,
        insuranceShare: share.insuranceShare,
      },
      include: { patient: true },
    });

    // Create the associated consultation row in PENDING state (locked for the doctor)
    await this.prisma.consultation.create({
      data: {
        patientId,
        doctorId,
        billingId: bill.id,
        status: ConsultationStatus.PENDING,
        specialty: specialty || 'Général',
      },
    });

    this.queueGateway.broadcastQueueUpdate();
    return bill;
  }

  async pay(id: string, cashierId: string | null, data: any) {
    const { paymentMethod, transactionId } = data;

    const bill = await this.prisma.billing.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Facture introuvable');

    const updatedBill = await this.prisma.billing.update({
      where: { id },
      data: {
        status: BillingStatus.PAID,
        cashierId: cashierId || null,
        paymentMethod,
        transactionId,
      },
      include: { patient: true, cashier: { select: { name: true } } },
    });

    // Automatically transition matching consultations to PAID state, unlocking them
    await this.prisma.consultation.updateMany({
      where: { billingId: id },
      data: { status: ConsultationStatus.PAID },
    });

    // Automatically add the patient to the Queue under VITALS if they aren't already in queue
    const hasQueueEntry = await this.prisma.queueEntry.findFirst({
      where: { patientId: bill.patientId },
    });

    if (!hasQueueEntry) {
      await this.prisma.queueEntry.create({
        data: {
          patientId: bill.patientId,
          department: 'VITALS',
          status: 'IN_QUEUE',
          priority: 'NORMAL',
        },
      });
    }

    this.queueGateway.broadcastQueueUpdate();
    return updatedBill;
  }

  async validateInsurance(id: string, data: { mutuelleName: string; coverageShare: number }) {
    const bill = await this.prisma.billing.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Facture introuvable');

    const coverageShare = data.coverageShare;
    const insuranceShare = (bill.amount * coverageShare) / 100;
    const patientShare = bill.amount - insuranceShare;

    return this.prisma.billing.update({
      where: { id },
      data: {
        mutuelleName: data.mutuelleName,
        insuranceCoverageShare: coverageShare,
        insuranceShare,
        patientShare,
        insuranceValidated: true,
      },
      include: { patient: true },
    });
  }
}
