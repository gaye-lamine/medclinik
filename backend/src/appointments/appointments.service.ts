import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

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
    const created = await this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        dateTime: new Date(data.dateTime),
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
      const dateFormatee = new Date(data.dateTime).toLocaleString('fr-FR', {
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  async admit(id: string, amount?: number) {
    // 1. Marquer le rendez-vous comme termine
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, code: true } },
        doctor: { select: { id: true, name: true, role: true } },
      }
    });

    // 2. Charger le patient pour les details mutuelle
    const patient = await this.prisma.patient.findUnique({
      where: { id: updatedAppointment.patientId },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    // 3. Creer la facture — le montant vient du caller (caisse) ou de la config
    const consultationAmount = amount ?? parseInt(process.env.DEFAULT_CONSULTATION_FEE || '15000');
    const coverage = patient.insuranceCoverageShare || 0;
    const insuranceShare = (consultationAmount * coverage) / 100;
    const patientShare = consultationAmount - insuranceShare;

    const bill = await this.prisma.billing.create({
      data: {
        patientId: updatedAppointment.patientId,
        amount: consultationAmount,
        status: 'UNPAID',
        mutuelleName: patient.mutuelleName,
        insuranceCoverageShare: coverage,
        patientShare,
        insuranceShare,
      },
    });

    // 4. Create consultation record linked to this bill
    const consultation = await this.prisma.consultation.create({
      data: {
        patientId: updatedAppointment.patientId,
        doctorId: updatedAppointment.doctorId,
        billingId: bill.id,
        status: 'PENDING',
        specialty: updatedAppointment.specialty,
      },
    });

    return {
      appointment: updatedAppointment,
      bill,
      consultation,
    };
  }
}
