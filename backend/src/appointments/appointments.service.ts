import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { AuditService } from '../audit/audit.service';
import { calculateInsuranceShare } from '../utils/billing.utils';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private auditService: AuditService,
  ) {}

  /**
   * Tâche planifiée exécutée toutes les 15 minutes via le décorateur Cron.
   * Marque automatiquement comme NO_SHOW les rendez-vous en statut SCHEDULED
   * dont l'heure est dépassée de X minutes (défaut : 60 min, configurable via NO_SHOW_THRESHOLD_MINUTES).
   */
  @Cron('*/15 * * * *')
  async markExpiredAppointmentsAsNoShow() {
    const thresholdMinutes = parseInt(process.env.NO_SHOW_THRESHOLD_MINUTES || '60', 10);
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000);

    return this.prisma.appointment.updateMany({
      where: {
        status: 'SCHEDULED',
        dateTime: { lt: cutoff },
      },
      data: {
        status: 'NO_SHOW',
      },
    });
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, code: true } },
        doctor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, role: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    return appointment;
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, code: true } },
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  async create(data: {
    patientId: string;
    doctorId: string;
    dateTime: string;
    specialty: string;
    notes?: string;
  }) {
    const start = new Date(data.dateTime);

    // Contrôle de date passée : Rejeter (400) si la date est antérieure à l'heure actuelle (marge de 60s pour la tolérance d'horloge)
    if (start.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé.');
    }

    // M5 — Anti-double-booking : détection d'overlap bidirectionnel
    const DURATION_MS =
      parseInt(process.env.CONSULTATION_DURATION_MINUTES || '30', 10) * 60_000;

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: 'SCHEDULED',
        dateTime: {
          gte: new Date(start.getTime() - DURATION_MS),
          lt: new Date(start.getTime() + DURATION_MS),
        },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Le médecin a déjà un rendez-vous prévu à ${conflict.dateTime.toLocaleTimeString('fr-FR')} ` +
        `qui chevauche ce créneau (durée de consultation : ${DURATION_MS / 60_000} min).`,
      );
    }

    const created = await this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        dateTime: start,
        status: 'SCHEDULED',
        specialty: data.specialty,
        notes: data.notes || null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    // SMS de confirmation de rendez-vous (non bloquant)
    const fullPatient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { phoneNumber: true, firstName: true, lastName: true },
    });
    if (fullPatient?.phoneNumber && created.doctor?.name) {
      const nom = `${fullPatient.firstName} ${fullPatient.lastName}`;
      const dateFormatee = start.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      const msg = `MedClinik : Rendez-vous confirme pour ${nom} avec Dr. ${created.doctor.name} le ${dateFormatee}. En cas d'empechement, contactez la clinique.`;
      this.smsService.send(fullPatient.phoneNumber, msg).catch(() => {});
    }

    return created;
  }

  async update(id: string, data: {
    dateTime?: string;
    status?: string;
    specialty?: string;
    notes?: string;
  }) {
    const appointment = await this.findOne(id);
    const updateData: any = {};

    if (data.dateTime) updateData.dateTime = new Date(data.dateTime);
    if (data.status) updateData.status = data.status;
    if (data.specialty) updateData.specialty = data.specialty;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    const deleted = await this.prisma.appointment.delete({ where: { id } });

    // M6 — Journal d'audit : suppression de rendez-vous
    await this.auditService.log({
      userId,
      action: 'DELETE',
      entityType: 'Appointment',
      entityId: id,
      details: { deletedAt: new Date().toISOString() },
    });

    return deleted;
  }

  /**
   * Admission d'un patient depuis un rendez-vous.
   */
  async admit(id: string, amount?: number, userId?: string) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) throw new NotFoundException('Rendez-vous introuvable');

    const result = await this.prisma.$transaction(async (tx) => {
      // Interdire l'admission si le patient a déjà une consultation active en cours
      const activeConsultation = await tx.consultation.findFirst({
        where: {
          patientId: existing.patientId,
          status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
        },
      });
      if (activeConsultation) {
        throw new ConflictException(
          `Le patient a déjà une consultation active en cours (statut : ${activeConsultation.status}). ` +
          'Veuillez terminer la consultation existante avant d\'en ouvrir une nouvelle.',
        );
      }

      // 1. Marquer le rendez-vous comme terminé
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, code: true } },
          doctor: { select: { id: true, name: true, role: true } },
        },
      });

      const patient = existing.patient;

      // M4 — Montant appliqué (explicite ou DEFAULT_CONSULTATION_FEE)
      const consultationAmount =
        amount ?? parseInt(process.env.DEFAULT_CONSULTATION_FEE || '15000', 10);

      // M3 — Calcul tiers-payant via utilitaire partagé
      const share = calculateInsuranceShare(
        consultationAmount,
        patient.insuranceCoverageShare || 0,
      );

      // 2. Créer la facture impayée (M2 : lien appointmentId)
      const bill = await tx.billing.create({
        data: {
          patientId: updatedAppointment.patientId,
          amount: share.amount,
          amountPaid: 0,
          status: 'UNPAID',
          mutuelleName: patient.mutuelleName,
          insuranceCoverageShare: share.insuranceCoverageShare,
          patientShare: share.patientShare,
          insuranceShare: share.insuranceShare,
          appointmentId: id, // M2
        },
      });

      // 3. Créer la consultation associée (M2 : lien appointmentId)
      const consultation = await tx.consultation.create({
        data: {
          patientId: updatedAppointment.patientId,
          doctorId: updatedAppointment.doctorId,
          billingId: bill.id,
          status: 'PENDING',
          specialty: updatedAppointment.specialty,
          appointmentId: id, // M2
        },
      });

      return {
        appointment: updatedAppointment,
        bill,
        consultation,
        appliedAmount: consultationAmount,
      };
    });

    // M6 — Journal d'audit
    await this.auditService.log({
      userId,
      action: 'ADMIT',
      entityType: 'Appointment',
      entityId: id,
      details: {
        billingId: result.bill.id,
        consultationId: result.consultation.id,
        appliedAmount: result.appliedAmount,
      },
    });

    return result;
  }
}
