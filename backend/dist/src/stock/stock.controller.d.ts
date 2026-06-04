import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
export declare class StockController {
    private stockService;
    constructor(stockService: StockService);
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
    create(body: CreateStockDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        unit: string;
        criticalThreshold: number;
        category: string;
    }>;
    update(id: string, body: UpdateStockDto): Promise<{
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
