import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
export declare class StockService {
    private prisma;
    private queueGateway;
    constructor(prisma: PrismaService, queueGateway: QueueGateway);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        unit: string;
        criticalThreshold: number;
        category: string;
    }[]>;
    findAlerts(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        unit: string;
        criticalThreshold: number;
        category: string;
    }[]>;
    create(data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        unit: string;
        criticalThreshold: number;
        category: string;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        unit: string;
        criticalThreshold: number;
        category: string;
    }>;
    findPrescriptionByCode(code: string): Promise<{
        consultation: {
            patient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                firstName: string;
                lastName: string;
                dateOfBirth: Date;
                gender: string;
                phoneNumber: string;
                address: string | null;
                mutuelleName: string | null;
                insuranceCoverageShare: number;
            };
            doctor: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            patientId: string;
            status: import("@prisma/client").$Enums.ConsultationStatus;
            diagnosis: string | null;
            notes: string | null;
            specialty: string;
            doctorId: string;
            vitalsId: string | null;
            billingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        uniqueCode: string;
        medicines: import("@prisma/client/runtime/client").JsonValue;
        instructions: string | null;
        isDelivered: boolean;
        consultationId: string;
    }>;
    deliverPrescription(id: string): Promise<{
        success: boolean;
        deliveredMedicines: number;
        stockItemsDeducted: number;
        totalBilling: number;
    }>;
}
