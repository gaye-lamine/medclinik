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
exports.VitalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_gateway_1 = require("../queue/queue.gateway");
const client_1 = require("@prisma/client");
let VitalsService = class VitalsService {
    prisma;
    queueGateway;
    constructor(prisma, queueGateway) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
    }
    async create(nurseId, data) {
        const { patientId, temperature, bloodPressure, weight, heartRate, bloodSugar, oxygenSaturation, comments } = data;
        const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException('Patient introuvable');
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
        const queueEntry = await this.prisma.queueEntry.findFirst({
            where: { patientId, department: client_1.QueueDepartment.VITALS },
        });
        if (queueEntry) {
            await this.prisma.queueEntry.update({
                where: { id: queueEntry.id },
                data: {
                    department: client_1.QueueDepartment.CONSULTATION,
                    status: client_1.QueueStatus.IN_QUEUE,
                },
            });
        }
        else {
            await this.prisma.queueEntry.create({
                data: {
                    patientId,
                    department: client_1.QueueDepartment.CONSULTATION,
                    status: client_1.QueueStatus.IN_QUEUE,
                },
            });
        }
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
    async getPatientHistory(patientId) {
        return this.prisma.vitals.findMany({
            where: { patientId },
            include: { nurse: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.VitalsService = VitalsService;
exports.VitalsService = VitalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway])
], VitalsService);
//# sourceMappingURL=vitals.service.js.map