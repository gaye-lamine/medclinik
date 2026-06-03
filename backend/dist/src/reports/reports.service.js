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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const consultationsCount = await this.prisma.consultation.count({
            where: {
                createdAt: { gte: today },
            },
        });
        const billsToday = await this.prisma.billing.findMany({
            where: {
                status: 'PAID',
                updatedAt: { gte: today },
            },
        });
        let totalRevenue = 0;
        let patientShareSum = 0;
        let insuranceShareSum = 0;
        billsToday.forEach((bill) => {
            totalRevenue += bill.amount;
            patientShareSum += bill.patientShare;
            insuranceShareSum += bill.insuranceShare;
        });
        const stockItems = await this.prisma.stockItem.findMany();
        const criticalStockCount = stockItems.filter(item => item.quantity <= item.criticalThreshold).length;
        const bedOccupancy = 64;
        const completedConsults = await this.prisma.consultation.findMany({
            where: { status: 'COMPLETED' },
            select: { diagnosis: true },
        });
        const pathologyCounts = {};
        completedConsults.forEach((c) => {
            if (c.diagnosis) {
                pathologyCounts[c.diagnosis] = (pathologyCounts[c.diagnosis] || 0) + 1;
            }
        });
        const pathologies = Object.keys(pathologyCounts).map((key) => ({
            name: key,
            value: pathologyCounts[key],
        }));
        if (pathologies.length === 0) {
            pathologies.push({ name: 'Aucune consultation terminée', value: 0 });
        }
        const doctors = await this.prisma.user.findMany({
            where: { role: 'DOCTOR' },
            include: {
                consultations: {
                    where: { status: 'COMPLETED' },
                },
            },
        });
        const doctorStats = doctors.map((doc) => ({
            name: doc.name,
            count: doc.consultations.length,
        }));
        return {
            metrics: {
                consultationsCount,
                totalRevenue,
                patientShareSum,
                insuranceShareSum,
                bedOccupancy,
                criticalStockCount,
            },
            pathologies,
            doctorStats,
        };
    }
    async getAdvancedReports() {
        const bills = await this.prisma.billing.findMany({
            where: { status: 'PAID' },
            include: { patient: true },
        });
        const financeBreakdown = {
            CASH: 0,
            WAVE: 0,
            ORANGE_MONEY: 0,
            MTN_MOMO: 0,
            CARD: 0,
        };
        bills.forEach((bill) => {
            const method = (bill.paymentMethod || 'CASH').toUpperCase();
            const txId = (bill.transactionId || '').toUpperCase();
            if (method === 'CASH') {
                financeBreakdown.CASH += bill.amount;
            }
            else if (method === 'CARD') {
                financeBreakdown.CARD += bill.amount;
            }
            else if (method === 'MOBILE_MONEY' || method === 'MOMO') {
                if (txId.includes('WAVE')) {
                    financeBreakdown.WAVE += bill.amount;
                }
                else if (txId.includes('ORANGE') || txId.includes('OM')) {
                    financeBreakdown.ORANGE_MONEY += bill.amount;
                }
                else {
                    financeBreakdown.MTN_MOMO += bill.amount;
                }
            }
            else {
                financeBreakdown.CASH += bill.amount;
            }
        });
        const financialSummary = [
            { method: 'Espèces (CASH)', amount: financeBreakdown.CASH, color: 'var(--success)' },
            { method: 'Wave Mobile Money', amount: financeBreakdown.WAVE, color: 'var(--primary-color)' },
            { method: 'Orange Money', amount: financeBreakdown.ORANGE_MONEY, color: 'var(--warning)' },
            { method: 'MTN Mobile Money', amount: financeBreakdown.MTN_MOMO, color: 'var(--danger)' },
            { method: 'Carte Bancaire', amount: financeBreakdown.CARD, color: 'var(--secondary-color)' },
        ];
        const consultations = await this.prisma.consultation.findMany({
            where: { status: 'COMPLETED' },
            select: { diagnosis: true },
        });
        const pathologyCounts = {};
        consultations.forEach((c) => {
            const diag = c.diagnosis || 'Non spécifié';
            pathologyCounts[diag] = (pathologyCounts[diag] || 0) + 1;
        });
        const totalConsults = consultations.length || 1;
        const pathologyStats = Object.keys(pathologyCounts).map((name) => ({
            name,
            count: pathologyCounts[name],
            percentage: Math.round((pathologyCounts[name] / totalConsults) * 100),
        })).sort((a, b) => b.count - a.count);
        const doctors = await this.prisma.user.findMany({
            where: { role: 'DOCTOR' },
            include: {
                consultations: {
                    include: { billing: true },
                },
            },
        });
        const practitionerStats = doctors.map((doc) => {
            const completed = doc.consultations.filter(c => c.status === 'COMPLETED');
            const totalGenerated = completed.reduce((sum, c) => sum + (c.billing?.amount || 0), 0);
            return {
                id: doc.id,
                name: doc.name,
                email: doc.email,
                phone: doc.phone || 'Non renseigné',
                completedCount: completed.length,
                totalRevenue: totalGenerated,
            };
        });
        return {
            financialSummary,
            pathologyStats,
            practitionerStats,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map