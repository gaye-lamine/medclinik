import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { QueueDepartment, QueueStatus } from '@prisma/client';

@Injectable()
export class VitalsService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async create(nurseId: string, data: any) {
    const { patientId, temperature, bloodPressure, weight, heartRate, bloodSugar, oxygenSaturation, comments } = data;

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const vitals = await this.prisma.vitals.create({
      data: {
        patientId,
        nurseId,
        temperature: temperature ? parseFloat(temperature) : null,
        bloodPressure,
        weight: weight ? parseFloat(weight) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        comments,
      },
    });

    // Check if the patient is in the VITALS queue
    const queueEntry = await this.prisma.queueEntry.findFirst({
      where: { patientId, department: QueueDepartment.VITALS },
    });

    if (queueEntry) {
      // Transition them to the doctor's CONSULTATION waitlist
      await this.prisma.queueEntry.update({
        where: { id: queueEntry.id },
        data: {
          department: QueueDepartment.CONSULTATION,
          status: QueueStatus.IN_QUEUE,
        },
      });
    } else {
      // Register them automatically for consultation
      await this.prisma.queueEntry.create({
        data: {
          patientId,
          department: QueueDepartment.CONSULTATION,
          status: QueueStatus.IN_QUEUE,
        },
      });
    }

    // Associate these vitals with any active pending/paid consultations
    const pendingConsultation = await this.prisma.consultation.findFirst({
      where: {
        patientId,
        status: { in: ['PENDING', 'PAID'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingConsultation) {
      await this.prisma.consultation.update({
        where: { id: pendingConsultation.id },
        data: { vitalsId: vitals.id },
      });
    }

    this.queueGateway.broadcastQueueUpdate();
    return vitals;
  }

  async getPatientHistory(patientId: string) {
    return this.prisma.vitals.findMany({
      where: { patientId },
      include: { nurse: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
