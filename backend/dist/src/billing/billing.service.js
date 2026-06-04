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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_gateway_1 = require("../queue/queue.gateway");
const client_1 = require("@prisma/client");
let BillingService = class BillingService {
    prisma;
    queueGateway;
    constructor(prisma, queueGateway) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
    }
    async findAll() {
        return this.prisma.billing.findMany({
            include: { patient: true, cashier: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.billing.findUnique({
            where: { id },
            include: { patient: true, cashier: { select: { name: true } } },
        });
    }
    async calculateShare(patientId, amount) {
        const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException('Patient introuvable');
        const coverage = patient.insuranceCoverageShare || 0;
        const insuranceShare = (amount * coverage) / 100;
        const patientShare = amount - insuranceShare;
        return {
            amount,
            mutuelleName: patient.mutuelleName,
            insuranceCoverageShare: coverage,
            patientShare,
            insuranceShare,
        };
    }
    async create(data) {
        const { patientId, amount, doctorId, specialty } = data;
        const share = await this.calculateShare(patientId, amount);
        const bill = await this.prisma.billing.create({
            data: {
                patientId,
                amount,
                status: client_1.BillingStatus.UNPAID,
                mutuelleName: share.mutuelleName,
                insuranceCoverageShare: share.insuranceCoverageShare,
                patientShare: share.patientShare,
                insuranceShare: share.insuranceShare,
            },
            include: { patient: true },
        });
        await this.prisma.consultation.create({
            data: {
                patientId,
                doctorId,
                billingId: bill.id,
                status: client_1.ConsultationStatus.PENDING,
                specialty: specialty || 'Général',
            },
        });
        this.queueGateway.broadcastQueueUpdate();
        return bill;
    }
    async pay(id, cashierId, data) {
        const { paymentMethod, transactionId } = data;
        const bill = await this.prisma.billing.findUnique({ where: { id } });
        if (!bill)
            throw new common_1.NotFoundException('Facture introuvable');
        const updatedBill = await this.prisma.billing.update({
            where: { id },
            data: {
                status: client_1.BillingStatus.PAID,
                cashierId: cashierId || null,
                paymentMethod,
                transactionId,
            },
        });
        await this.prisma.consultation.updateMany({
            where: { billingId: id },
            data: { status: client_1.ConsultationStatus.PAID },
        });
        const hasQueueEntry = await this.prisma.queueEntry.findFirst({
            where: { patientId: bill.patientId },
        });
        if (!hasQueueEntry) {
            await this.prisma.queueEntry.create({
                data: {
                    patientId: bill.patientId,
                    department: 'VITALS',
                    status: 'IN_QUEUE',
                    priority: 'NORMAL',
                },
            });
        }
        this.queueGateway.broadcastQueueUpdate();
        return updatedBill;
    }
    async validateInsurance(id, data) {
        const bill = await this.prisma.billing.findUnique({ where: { id } });
        if (!bill)
            throw new common_1.NotFoundException('Facture introuvable');
        const coverageShare = data.coverageShare;
        const insuranceShare = (bill.amount * coverageShare) / 100;
        const patientShare = bill.amount - insuranceShare;
        return this.prisma.billing.update({
            where: { id },
            data: {
                mutuelleName: data.mutuelleName,
                insuranceCoverageShare: coverageShare,
                insuranceShare,
                patientShare,
                insuranceValidated: true,
            },
            include: { patient: true },
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway])
], BillingService);
//# sourceMappingURL=billing.service.js.map