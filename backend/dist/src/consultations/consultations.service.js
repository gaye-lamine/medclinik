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
exports.ConsultationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_gateway_1 = require("../queue/queue.gateway");
const client_1 = require("@prisma/client");
let ConsultationsService = class ConsultationsService {
    prisma;
    queueGateway;
    constructor(prisma, queueGateway) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
    }
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
    async findOne(id) {
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
    async start(id) {
        const consultation = await this.prisma.consultation.update({
            where: { id },
            data: { status: client_1.ConsultationStatus.IN_PROGRESS },
            include: { patient: true },
        });
        const queueEntry = await this.prisma.queueEntry.findFirst({
            where: { patientId: consultation.patientId, assignedDoctorId: consultation.doctorId },
        });
        if (queueEntry) {
            await this.prisma.queueEntry.update({
                where: { id: queueEntry.id },
                data: { status: client_1.QueueStatus.IN_CONSULTATION },
            });
        }
        this.queueGateway.broadcastQueueUpdate();
        return consultation;
    }
    async complete(id, data) {
        const { diagnosis, notes } = data;
        const consultation = await this.prisma.consultation.update({
            where: { id },
            data: {
                diagnosis,
                notes,
                status: client_1.ConsultationStatus.COMPLETED,
            },
            include: { patient: true },
        });
        const queueEntry = await this.prisma.queueEntry.findFirst({
            where: { patientId: consultation.patientId },
        });
        if (queueEntry) {
            await this.prisma.queueEntry.delete({ where: { id: queueEntry.id } });
        }
        this.queueGateway.broadcastQueueUpdate();
        return consultation;
    }
    async createPrescription(id, data) {
        const { medicines, instructions } = data;
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
};
exports.ConsultationsService = ConsultationsService;
exports.ConsultationsService = ConsultationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway])
], ConsultationsService);
//# sourceMappingURL=consultations.service.js.map