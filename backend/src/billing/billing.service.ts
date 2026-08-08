import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { BillingStatus, ConsultationStatus, Prisma } from '@prisma/client';

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

    // Encapsuler dans une transaction atomique Prisma
    const bill = await this.prisma.$transaction(async (tx) => {
      const createdBill = await tx.billing.create({
        data: {
          patientId,
          amount,
          amountPaid: 0,
          status: BillingStatus.UNPAID,
          mutuelleName: share.mutuelleName,
          insuranceCoverageShare: share.insuranceCoverageShare,
          patientShare: share.patientShare,
          insuranceShare: share.insuranceShare,
        },
        include: { patient: true },
      });

      await tx.consultation.create({
        data: {
          patientId,
          doctorId,
          billingId: createdBill.id,
          status: ConsultationStatus.PENDING,
          specialty: specialty || 'Général',
        },
      });

      return createdBill;
    });

    this.queueGateway.broadcastQueueUpdate();
    return bill;
  }

  async pay(id: string, cashierId: string | null, data: any) {
    const { paymentMethod, transactionId, amountPaid } = data;

    /**
     * Logique de retry pour les conflits de sérialisation Prisma P2034.
     * PostgreSQL peut rejeter une transaction SERIALIZABLE si elle entre en
     * conflit avec une transaction concurrente. On réessaie jusqu'à 3 fois
     * avec un backoff exponentiel court (50 ms → 100 ms) avant de renvoyer
     * une 409 lisible au caissier plutôt qu'un 500 brut.
     */
    const MAX_RETRIES = 3;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const updatedBill = await this.prisma.$transaction(
          async (tx) => {
            const bill = await tx.billing.findUnique({ where: { id } });
            if (!bill) throw new NotFoundException('Facture introuvable');

            // Garde 1 : Rejeter si la facture est déjà entièrement réglée
            if (bill.status === BillingStatus.PAID) {
              throw new ConflictException('Cette facture a déjà été entièrement réglée.');
            }

            // Garde 2 : Rejeter si la facture est annulée ou remboursée
            if (bill.status === BillingStatus.CANCELLED || bill.status === BillingStatus.REFUNDED) {
              throw new BadRequestException(
                `Impossible de payer une facture avec le statut : ${bill.status}`,
              );
            }

            // 1. Calcul du montant de l'incrément basé sur les valeurs fraîches lues dans tx
            const currentAmountPaid = bill.amountPaid || 0;
            const paymentIncrement =
              amountPaid !== undefined
                ? parseFloat(amountPaid)
                : Math.max(0, bill.patientShare - currentAmountPaid);

            // 2. Incrémentation atomique du montant réglé en base
            const incResult = await tx.billing.update({
              where: { id },
              data: {
                amountPaid: { increment: paymentIncrement },
                cashierId: cashierId || null,
                paymentMethod: paymentMethod || bill.paymentMethod,
                transactionId: transactionId || bill.transactionId,
              },
            });

            // 3. Évaluation du statut sur la valeur RÉELLE post-incrément retournée par la BD
            const isFullyPaid = incResult.amountPaid >= incResult.patientShare;
            const finalStatus = isFullyPaid ? BillingStatus.PAID : BillingStatus.PARTIALLY_PAID;

            // 4. Mise à jour du statut calculé sur la donnée exacte en base
            const updated = await tx.billing.update({
              where: { id },
              data: { status: finalStatus },
              include: { patient: true, cashier: { select: { name: true } } },
            });

            // 5. Débloquer la consultation uniquement en cas de paiement intégral
            if (isFullyPaid) {
              await tx.consultation.updateMany({
                where: { billingId: id },
                data: { status: ConsultationStatus.PAID },
              });

              const hasQueueEntry = await tx.queueEntry.findFirst({
                where: { patientId: bill.patientId },
              });

              if (!hasQueueEntry) {
                await tx.queueEntry.create({
                  data: {
                    patientId: bill.patientId,
                    department: 'VITALS',
                    status: 'IN_QUEUE',
                    priority: 'NORMAL',
                  },
                });
              }
            }

            return updated;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        // Succès : diffuser la mise à jour et retourner
        this.queueGateway.broadcastQueueUpdate();
        return updatedBill;
      } catch (err: any) {
        // P2034 = "Transaction failed due to a write conflict or a deadlock.
        // Please retry your transaction" (Prisma Serializable conflict)
        const isSerializationConflict =
          err?.code === 'P2034' ||
          (err?.message ?? '').includes('write conflict') ||
          (err?.message ?? '').includes('deadlock');

        if (!isSerializationConflict) {
          // Toute autre erreur (404, 400, 409 métier, etc.) remonte immédiatement
          throw err;
        }

        lastError = err;

        if (attempt < MAX_RETRIES) {
          // Backoff exponentiel : 50 ms pour la tentative 1, 100 ms pour la 2
          await sleep(50 * attempt);
        }
      }
    }

    // Toutes les tentatives ont échoué sur un conflit de sérialisation
    throw new ConflictException(
      'Le paiement est temporairement impossible en raison d\'une concurrence élevée. ' +
        'Veuillez réessayer dans quelques instants.',
    );
  }

  /**
   * Remboursement d'une facture payée ou partiellement payée (Statut -> REFUNDED)
   * Réservé aux factures ayant déjà fait l'objet d'un règlement.
   */
  async refund(id: string, cashierId: string | null, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.billing.findUnique({ where: { id } });
      if (!bill) throw new NotFoundException('Facture introuvable');

      if (bill.status !== BillingStatus.PAID && bill.status !== BillingStatus.PARTIALLY_PAID) {
        throw new BadRequestException(`Seules les factures réglées ou partiellement réglées peuvent être remboursées. Statut actuel : ${bill.status}`);
      }

      const updated = await tx.billing.update({
        where: { id },
        data: {
          status: BillingStatus.REFUNDED,
          refundReason: reason,
          cashierId: cashierId || bill.cashierId,
        },
        include: { patient: true, cashier: { select: { name: true } } },
      });

      // Annuler le déblocage de la consultation si elle était payée
      await tx.consultation.updateMany({
        where: { billingId: id },
        data: { status: ConsultationStatus.PENDING },
      });

      this.queueGateway.broadcastQueueUpdate();
      return updated;
    });
  }

  /**
   * Annulation d'une facture impayée avant tout règlement (Statut -> CANCELLED)
   * Réservé aux factures en attente de paiement.
   */
  async cancel(id: string, cashierId: string | null, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.billing.findUnique({ where: { id } });
      if (!bill) throw new NotFoundException('Facture introuvable');

      if (bill.status !== BillingStatus.UNPAID) {
        throw new BadRequestException(`Seules les factures impayées peuvent être annulées. Statut actuel : ${bill.status}`);
      }

      const updated = await tx.billing.update({
        where: { id },
        data: {
          status: BillingStatus.CANCELLED,
          refundReason: reason,
          cashierId: cashierId || bill.cashierId,
        },
        include: { patient: true, cashier: { select: { name: true } } },
      });

      this.queueGateway.broadcastQueueUpdate();
      return updated;
    });
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
