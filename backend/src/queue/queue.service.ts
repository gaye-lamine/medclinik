import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';
import { SmsService } from '../sms/sms.service';
import { QueueStatus, QueueDepartment } from '@prisma/client';

@Injectable()
export class QueueService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
    private smsService: SmsService,
  ) {}

  async getQueue() {
    return this.prisma.queueEntry.findMany({
      include: {
        patient: true,
        assignedDoctor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async register(data: any) {
    const entry = await this.prisma.queueEntry.create({
      data: {
        patientId: data.patientId,
        department: data.department as QueueDepartment,
        priority: data.priority || 'NORMAL',
        status: QueueStatus.IN_QUEUE,
        assignedDoctorId: data.assignedDoctorId || null,
      },
      include: {
        patient: true,
      },
    });

    // Compter la position dans la file
    const position = await this.prisma.queueEntry.count({
      where: { status: QueueStatus.IN_QUEUE },
    });

    // SMS de confirmation d'enregistrement si le patient a un numero
    const patient = entry.patient as any;
    if (patient?.phoneNumber) {
      const nom = `${patient.firstName} ${patient.lastName}`;
      const msg = `MedClinik : ${nom}, vous etes enregistre en file d'attente (position ${position}). Nous vous appellerons des que votre tour arrive.`;
      this.smsService.send(patient.phoneNumber, msg).catch(() => {});
    }

    this.queueGateway.broadcastQueueUpdate();
    return entry;
  }

  async call(id: string, doctorId?: string) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrée file d\'attente introuvable');

    // Recuperer le medecin si assigné
    const doctor = doctorId || entry.assignedDoctorId
      ? await this.prisma.user.findUnique({
          where: { id: doctorId || entry.assignedDoctorId! },
          select: { name: true },
        })
      : null;

    const updated = await this.prisma.queueEntry.update({
      where: { id },
      data: {
        status: QueueStatus.CALLING,
        assignedDoctorId: doctorId || entry.assignedDoctorId,
      },
      include: { patient: true },
    });

    // SMS d'appel uniquement si le medecin est connu et le patient a un numero
    const patient = updated.patient as any;
    if (patient?.phoneNumber && doctor?.name) {
      const nom = `${patient.firstName} ${patient.lastName}`;
      const msg = `MedClinik : ${nom}, vous etes appele en consultation avec Dr. ${doctor.name}. Presentez-vous au cabinet.`;
      this.smsService.send(patient.phoneNumber, msg).catch(() => {});
    }

    this.queueGateway.broadcastQueueUpdate();
    return updated;
  }

  async start(id: string) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrée file d\'attente introuvable');

    const updated = await this.prisma.queueEntry.update({
      where: { id },
      data: {
        status: QueueStatus.IN_CONSULTATION,
      },
      include: { patient: true },
    });

    this.queueGateway.broadcastQueueUpdate();
    return updated;
  }

  async finish(id: string) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrée file d\'attente introuvable');

    await this.prisma.queueEntry.delete({ where: { id } });
    this.queueGateway.broadcastQueueUpdate();
    return { success: true };
  }
}
