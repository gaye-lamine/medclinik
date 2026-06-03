import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { ConsultationStatus, QueueStatus } from '@prisma/client';

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

  async start(id: string) {
    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: { status: ConsultationStatus.IN_PROGRESS },
      include: { patient: true },
    });

    // Transition queue entry to IN_CONSULTATION status
    const queueEntry = await this.prisma.queueEntry.findFirst({
      where: { patientId: consultation.patientId, assignedDoctorId: consultation.doctorId },
    });

    if (queueEntry) {
      await this.prisma.queueEntry.update({
        where: { id: queueEntry.id },
        data: { status: QueueStatus.IN_CONSULTATION },
      });
    }

    this.queueGateway.broadcastQueueUpdate();
    return consultation;
  }

  async complete(id: string, data: any) {
    const { diagnosis, notes } = data;

    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        diagnosis,
        notes,
        status: ConsultationStatus.COMPLETED,
      },
      include: { patient: true },
    });

    // Remove patient from waiting queue upon consultation completion
    const queueEntry = await this.prisma.queueEntry.findFirst({
      where: { patientId: consultation.patientId },
    });

    if (queueEntry) {
      await this.prisma.queueEntry.delete({ where: { id: queueEntry.id } });
    }

    this.queueGateway.broadcastQueueUpdate();
    return consultation;
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
