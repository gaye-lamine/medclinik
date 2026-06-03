"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sms_service_1 = require("../sms/sms.service");
let AppointmentsService = class AppointmentsService {
    prisma;
    smsService;
    constructor(prisma, smsService) {
        this.prisma = prisma;
        this.smsService = smsService;
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
    async findOne(id) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, role: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Rendez-vous introuvable');
        }
        return appointment;
    }
    async findByDoctor(doctorId) {
        return this.prisma.appointment.findMany({
            where: { doctorId },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, code: true } },
            },
            orderBy: { dateTime: 'asc' },
        });
    }
    async create(data) {
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
            this.smsService.send(fullPatient.phoneNumber, msg).catch(() => { });
        }
        return created;
    }
    async update(id, data) {
        const appointment = await this.findOne(id);
        const updateData = {};
        if (data.dateTime)
            updateData.dateTime = new Date(data.dateTime);
        if (data.status)
            updateData.status = data.status;
        if (data.specialty)
            updateData.specialty = data.specialty;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        return this.prisma.appointment.update({
            where: { id },
            data: updateData,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                doctor: { select: { id: true, name: true } },
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.appointment.delete({
            where: { id },
        });
    }
    async admit(id, amount) {
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id },
            data: { status: 'COMPLETED' },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, code: true } },
                doctor: { select: { id: true, name: true, role: true } },
            }
        });
        const patient = await this.prisma.patient.findUnique({
            where: { id: updatedAppointment.patientId },
        });
        if (!patient)
            throw new common_1.NotFoundException('Patient introuvable');
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map