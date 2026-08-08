import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { ConsultationStatus, QueueStatus, QueueDepartment } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async findAll() {
    return this.prisma.consultation.findMany({
      include: {
        patient: true,
        doctor: { select: { name: true } },
        vitals: true,
        billing: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { name: true } },
        vitals: true,
        billing: true,
        prescriptions: true,
      },
    });
  }

  /**
   * M1 — Guard : start() exige Consultation.status === PAID (pré-condition).
   * Flux : PENDING → PAID (billing.pay) → IN_PROGRESS (start) → COMPLETED (complete)
   *
   * Le médecin ne peut démarrer la consultation que si le patient a réglé sa facture.
   */
  async start(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!consultation) throw new NotFoundException('Consultation introuvable');

    // Guard M1 : statut requis avant start() = PAID
    if (consultation.status !== ConsultationStatus.PAID) {
      throw new ConflictException(
        `La consultation ne peut pas démarrer : le statut actuel est "${consultation.status}". ` +
          'Le paiement du patient doit être enregistré avant de démarrer la consultation (statut requis : PAID).',
      );
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: { status: ConsultationStatus.IN_PROGRESS },
      include: { patient: true },
    });

    // Transition queue entry to IN_CONSULTATION status
    const queueEntry = await this.prisma.queueEntry.findFirst({
      where: {
        patientId: consultation.patientId,
        assignedDoctorId: consultation.doctorId,
      },
    });

    if (queueEntry) {
      await this.prisma.queueEntry.update({
        where: { id: queueEntry.id },
        data: { status: QueueStatus.IN_CONSULTATION },
      });
    }

    this.queueGateway.broadcastQueueUpdate();
    return updated;
  }

  /**
   * M1 — Guard : complete() exige Consultation.status === IN_PROGRESS.
   * M7 — Au lieu de supprimer le QueueEntry, le patient est transféré en file CASHIER.
   *
   * Le patient attend ensuite en caisse pour régler (si pas déjà payé).
   */
  async complete(id: string, data: any) {
    const { diagnosis, notes } = data;

    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!consultation) throw new NotFoundException('Consultation introuvable');

    // Guard M1 : statut requis avant complete() = IN_PROGRESS
    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new ConflictException(
        `La consultation ne peut pas être complétée : le statut actuel est "${consultation.status}". ` +
          'La consultation doit être en cours (statut requis : IN_PROGRESS).',
      );
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        diagnosis,
        notes,
        status: ConsultationStatus.COMPLETED,
      },
      include: { patient: true },
    });

    // M7 — Transférer le QueueEntry vers le département CASHIER au lieu de le supprimer
    const queueEntry = await this.prisma.queueEntry.findFirst({
      where: { patientId: consultation.patientId },
    });

    if (queueEntry) {
      await this.prisma.queueEntry.update({
        where: { id: queueEntry.id },
        data: {
          department: QueueDepartment.CASHIER,
          status: QueueStatus.IN_QUEUE,
          // Réinitialiser le médecin assigné : le patient n'est plus avec un médecin
          assignedDoctorId: null,
        },
      });
    }

    this.queueGateway.broadcastQueueUpdate();
    return updated;
  }

  async createPrescription(id: string, data: any) {
    const { medicines, instructions } = data;

    // Generate consecutive cryptographic RX code
    const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const rxCode = `RX-${new Date().getFullYear()}-${uniqueSuffix}`;

    return this.prisma.prescription.create({
      data: {
        consultationId: id,
        uniqueCode: rxCode,
        medicines,
        instructions,
      },
    });
  }
}
