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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_gateway_1 = require("../queue/queue.gateway");
const inventory_exception_1 = require("../common/exceptions/inventory.exception");
let StockService = class StockService {
    prisma;
    queueGateway;
    constructor(prisma, queueGateway) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
    }
    async findAll() {
        return this.prisma.stockItem.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findAlerts() {
        return this.prisma.stockItem.findMany({
            where: {
                quantity: { lte: this.prisma.stockItem.fields.criticalThreshold },
            },
            orderBy: { quantity: 'asc' },
        });
    }
    async create(data) {
        return this.prisma.stockItem.create({
            data: {
                name: data.name,
                quantity: parseFloat(data.quantity),
                unit: data.unit,
                criticalThreshold: parseFloat(data.criticalThreshold),
                category: data.category,
            },
        });
    }
    async update(id, data) {
        const item = await this.prisma.stockItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Article en stock introuvable');
        return this.prisma.stockItem.update({
            where: { id },
            data: {
                quantity: data.quantity !== undefined ? parseFloat(data.quantity) : undefined,
                criticalThreshold: data.criticalThreshold !== undefined ? parseFloat(data.criticalThreshold) : undefined,
            },
        });
    }
    async findPrescriptionByCode(code) {
        const rx = await this.prisma.prescription.findUnique({
            where: { uniqueCode: code.trim().toUpperCase() },
            include: {
                consultation: {
                    include: {
                        patient: true,
                        doctor: { select: { name: true } },
                    },
                },
            },
        });
        if (!rx) {
            throw new common_1.NotFoundException('Ordonnance introuvable avec ce code RX.');
        }
        return rx;
    }
    async deliverPrescription(id) {
        const rx = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                consultation: {
                    include: {
                        patient: true,
                    },
                },
            },
        });
        if (!rx)
            throw new common_1.NotFoundException('Ordonnance introuvable');
        if (rx.isDelivered)
            throw new inventory_exception_1.InventoryException('Cette ordonnance a déjà été délivrée.', 'INVENTORY_ALREADY_DELIVERED');
        await this.prisma.prescription.update({
            where: { id },
            data: { isDelivered: true },
        });
        const meds = rx.medicines;
        let matchedCount = 0;
        for (const med of meds) {
            const stockItem = await this.prisma.stockItem.findFirst({
                where: {
                    name: {
                        contains: med.name.split(' ')[0],
                        mode: 'insensitive',
                    },
                },
            });
            if (stockItem) {
                matchedCount++;
                const quantityToDeduct = 1;
                await this.prisma.stockItem.update({
                    where: { id: stockItem.id },
                    data: {
                        quantity: Math.max(0, stockItem.quantity - quantityToDeduct),
                    },
                });
            }
        }
        const pricePerMed = 3000;
        const totalAmount = meds.length * pricePerMed;
        const patient = rx.consultation.patient;
        const coverage = patient.insuranceCoverageShare || 0;
        const insuranceShare = (totalAmount * coverage) / 100;
        const patientShare = totalAmount - insuranceShare;
        await this.prisma.billing.create({
            data: {
                patientId: patient.id,
                amount: totalAmount,
                status: 'PAID',
                paymentMethod: 'WAVE',
                transactionId: `RX-DELIV-${rx.uniqueCode}`,
                mutuelleName: patient.mutuelleName,
                insuranceCoverageShare: coverage,
                patientShare,
                insuranceShare,
            },
        });
        this.queueGateway.broadcastQueueUpdate();
        return {
            success: true,
            deliveredMedicines: meds.length,
            stockItemsDeducted: matchedCount,
            totalBilling: totalAmount,
        };
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway])
], StockService);
//# sourceMappingURL=stock.service.js.map