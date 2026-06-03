import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardData(): Promise<{
        metrics: {
            consultationsCount: number;
            totalRevenue: number;
            patientShareSum: number;
            insuranceShareSum: number;
            bedOccupancy: number;
            criticalStockCount: number;
        };
        pathologies: {
            name: string;
            value: number;
        }[];
        doctorStats: {
            name: string;
            count: number;
        }[];
    }>;
    getAdvancedReports(): Promise<{
        financialSummary: {
            method: string;
            amount: number;
            color: string;
        }[];
        pathologyStats: {
            name: string;
            count: number;
            percentage: number;
        }[];
        practitionerStats: {
            id: string;
            name: string;
            email: string;
            phone: string;
            completedCount: number;
            totalRevenue: number;
        }[];
    }>;
}
