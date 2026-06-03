import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Consultations count today
    const consultationsCount = await this.prisma.consultation.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // 2. Cash desk volume (Total paid today)
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

    // 3. Count of stock items below threshold
    const stockItems = await this.prisma.stockItem.findMany();
    const criticalStockCount = stockItems.filter(item => item.quantity <= item.criticalThreshold).length;

    // 4. Mock Bed Occupancy representation
    const bedOccupancy = 64; // percentage

    // 5. Treated pathologies breakdown
    const completedConsults = await this.prisma.consultation.findMany({
      where: { status: 'COMPLETED' },
      select: { diagnosis: true },
    });

    const pathologyCounts: Record<string, number> = {};
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

    // 6. Practitioner stats
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
    // 1. Finance breakdown by payment method
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
      } else if (method === 'CARD') {
        financeBreakdown.CARD += bill.amount;
      } else if (method === 'MOBILE_MONEY' || method === 'MOMO') {
        if (txId.includes('WAVE')) {
          financeBreakdown.WAVE += bill.amount;
        } else if (txId.includes('ORANGE') || txId.includes('OM')) {
          financeBreakdown.ORANGE_MONEY += bill.amount;
        } else {
          financeBreakdown.MTN_MOMO += bill.amount;
        }
      } else {
        financeBreakdown.CASH += bill.amount;
      }
    });

    // Convert breakdown to list for chart/table
    const financialSummary = [
      { method: 'Espèces (CASH)', amount: financeBreakdown.CASH, color: 'var(--success)' },
      { method: 'Wave Mobile Money', amount: financeBreakdown.WAVE, color: 'var(--primary-color)' },
      { method: 'Orange Money', amount: financeBreakdown.ORANGE_MONEY, color: 'var(--warning)' },
      { method: 'MTN Mobile Money', amount: financeBreakdown.MTN_MOMO, color: 'var(--danger)' },
      { method: 'Carte Bancaire', amount: financeBreakdown.CARD, color: 'var(--secondary-color)' },
    ];

    // 2. Pathology breakdown
    const consultations = await this.prisma.consultation.findMany({
      where: { status: 'COMPLETED' },
      select: { diagnosis: true },
    });

    const pathologyCounts: Record<string, number> = {};
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

    // 3. Practitioner performance stats
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
}
