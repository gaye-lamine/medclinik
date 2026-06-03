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
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_gateway_1 = require("./queue.gateway");
const sms_service_1 = require("../sms/sms.service");
const client_1 = require("@prisma/client");
let QueueService = class QueueService {
    prisma;
    queueGateway;
    smsService;
    constructor(prisma, queueGateway, smsService) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
        this.smsService = smsService;
    }
    async getQueue() {
        return this.prisma.queueEntry.findMany({
            include: {
                patient: true,
                assignedDoctor: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async register(data) {
        const entry = await this.prisma.queueEntry.create({
            data: {
                patientId: data.patientId,
                department: data.department,
                priority: data.priority || 'NORMAL',
                status: client_1.QueueStatus.IN_QUEUE,
                assignedDoctorId: data.assignedDoctorId || null,
            },
            include: {
                patient: true,
            },
        });
        const position = await this.prisma.queueEntry.count({
            where: { status: client_1.QueueStatus.IN_QUEUE },
        });
        const patient = entry.patient;
        if (patient?.phoneNumber) {
            const nom = `${patient.firstName} ${patient.lastName}`;
            const msg = `MedClinik : ${nom}, vous etes enregistre en file d'attente (position ${position}). Nous vous appellerons des que votre tour arrive.`;
            this.smsService.send(patient.phoneNumber, msg).catch(() => { });
        }
        this.queueGateway.broadcastQueueUpdate();
        return entry;
    }
    async call(id, doctorId) {
        const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entrée file d\'attente introuvable');
        const doctor = doctorId || entry.assignedDoctorId
            ? await this.prisma.user.findUnique({
                where: { id: doctorId || entry.assignedDoctorId },
                select: { name: true },
            })
            : null;
        const updated = await this.prisma.queueEntry.update({
            where: { id },
            data: {
                status: client_1.QueueStatus.CALLING,
                assignedDoctorId: doctorId || entry.assignedDoctorId,
            },
            include: { patient: true },
        });
        const patient = updated.patient;
        if (patient?.phoneNumber && doctor?.name) {
            const nom = `${patient.firstName} ${patient.lastName}`;
            const msg = `MedClinik : ${nom}, vous etes appele en consultation avec Dr. ${doctor.name}. Presentez-vous au cabinet.`;
            this.smsService.send(patient.phoneNumber, msg).catch(() => { });
        }
        this.queueGateway.broadcastQueueUpdate();
        return updated;
    }
    async start(id) {
        const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entrée file d\'attente introuvable');
        const updated = await this.prisma.queueEntry.update({
            where: { id },
            data: {
                status: client_1.QueueStatus.IN_CONSULTATION,
            },
            include: { patient: true },
        });
        this.queueGateway.broadcastQueueUpdate();
        return updated;
    }
    async finish(id) {
        const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entrée file d\'attente introuvable');
        await this.prisma.queueEntry.delete({ where: { id } });
        this.queueGateway.broadcastQueueUpdate();
        return { success: true };
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway,
        sms_service_1.SmsService])
], QueueService);
//# sourceMappingURL=queue.service.js.map