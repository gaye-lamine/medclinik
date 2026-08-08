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
        const bill = await this.prisma.$transaction(async (tx) => {
            const createdBill = await tx.billing.create({
                data: {
                    patientId,
                    amount,
                    amountPaid: 0,
                    status: client_1.BillingStatus.UNPAID,
                    mutuelleName: share.mutuelleName,
                    insuranceCoverageShare: share.insuranceCoverageShare,
                    patientShare: share.patientShare,
                    insuranceShare: share.insuranceShare,
                },
                include: { patient: true },
            });
            await tx.consultation.create({
                data: {
                    patientId,
                    doctorId,
                    billingId: createdBill.id,
                    status: client_1.ConsultationStatus.PENDING,
                    specialty: specialty || 'Général',
                },
            });
            return createdBill;
        });
        this.queueGateway.broadcastQueueUpdate();
        return bill;
    }
    async pay(id, cashierId, data) {
        const { paymentMethod, transactionId, amountPaid } = data;
        const MAX_RETRIES = 3;
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        let lastError;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const updatedBill = await this.prisma.$transaction(async (tx) => {
                    const bill = await tx.billing.findUnique({ where: { id } });
                    if (!bill)
                        throw new common_1.NotFoundException('Facture introuvable');
                    if (bill.status === client_1.BillingStatus.PAID) {
                        throw new common_1.ConflictException('Cette facture a déjà été entièrement réglée.');
                    }
                    if (bill.status === client_1.BillingStatus.CANCELLED || bill.status === client_1.BillingStatus.REFUNDED) {
                        throw new common_1.BadRequestException(`Impossible de payer une facture avec le statut : ${bill.status}`);
                    }
                    const currentAmountPaid = bill.amountPaid || 0;
                    const paymentIncrement = amountPaid !== undefined
                        ? parseFloat(amountPaid)
                        : Math.max(0, bill.patientShare - currentAmountPaid);
                    const incResult = await tx.billing.update({
                        where: { id },
                        data: {
                            amountPaid: { increment: paymentIncrement },
                            cashierId: cashierId || null,
                            paymentMethod: paymentMethod || bill.paymentMethod,
                            transactionId: transactionId || bill.transactionId,
                        },
                    });
                    const isFullyPaid = incResult.amountPaid >= incResult.patientShare;
                    const finalStatus = isFullyPaid ? client_1.BillingStatus.PAID : client_1.BillingStatus.PARTIALLY_PAID;
                    const updated = await tx.billing.update({
                        where: { id },
                        data: { status: finalStatus },
                        include: { patient: true, cashier: { select: { name: true } } },
                    });
                    if (isFullyPaid) {
                        await tx.consultation.updateMany({
                            where: { billingId: id },
                            data: { status: client_1.ConsultationStatus.PAID },
                        });
                        const hasQueueEntry = await tx.queueEntry.findFirst({
                            where: { patientId: bill.patientId },
                        });
                        if (!hasQueueEntry) {
                            await tx.queueEntry.create({
                                data: {
                                    patientId: bill.patientId,
                                    department: 'VITALS',
                                    status: 'IN_QUEUE',
                                    priority: 'NORMAL',
                                },
                            });
                        }
                    }
                    return updated;
                }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
                this.queueGateway.broadcastQueueUpdate();
                return updatedBill;
            }
            catch (err) {
                const isSerializationConflict = err?.code === 'P2034' ||
                    (err?.message ?? '').includes('write conflict') ||
                    (err?.message ?? '').includes('deadlock');
                if (!isSerializationConflict) {
                    throw err;
                }
                lastError = err;
                if (attempt < MAX_RETRIES) {
                    await sleep(50 * attempt);
                }
            }
        }
        throw new common_1.ConflictException('Le paiement est temporairement impossible en raison d\'une concurrence élevée. ' +
            'Veuillez réessayer dans quelques instants.');
    }
    async refund(id, cashierId, reason) {
        return this.prisma.$transaction(async (tx) => {
            const bill = await tx.billing.findUnique({ where: { id } });
            if (!bill)
                throw new common_1.NotFoundException('Facture introuvable');
            if (bill.status !== client_1.BillingStatus.PAID && bill.status !== client_1.BillingStatus.PARTIALLY_PAID) {
                throw new common_1.BadRequestException(`Seules les factures réglées ou partiellement réglées peuvent être remboursées. Statut actuel : ${bill.status}`);
            }
            const updated = await tx.billing.update({
                where: { id },
                data: {
                    status: client_1.BillingStatus.REFUNDED,
                    refundReason: reason,
                    cashierId: cashierId || bill.cashierId,
                },
                include: { patient: true, cashier: { select: { name: true } } },
            });
            await tx.consultation.updateMany({
                where: { billingId: id },
                data: { status: client_1.ConsultationStatus.PENDING },
            });
            this.queueGateway.broadcastQueueUpdate();
            return updated;
        });
    }
    async cancel(id, cashierId, reason) {
        return this.prisma.$transaction(async (tx) => {
            const bill = await tx.billing.findUnique({ where: { id } });
            if (!bill)
                throw new common_1.NotFoundException('Facture introuvable');
            if (bill.status !== client_1.BillingStatus.UNPAID) {
                throw new common_1.BadRequestException(`Seules les factures impayées peuvent être annulées. Statut actuel : ${bill.status}`);
            }
            const updated = await tx.billing.update({
                where: { id },
                data: {
                    status: client_1.BillingStatus.CANCELLED,
                    refundReason: reason,
                    cashierId: cashierId || bill.cashierId,
                },
                include: { patient: true, cashier: { select: { name: true } } },
            });
            this.queueGateway.broadcastQueueUpdate();
            return updated;
        });
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