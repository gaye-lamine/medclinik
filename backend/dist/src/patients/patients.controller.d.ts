import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
export declare class PatientsController {
    private patientsService;
    constructor(patientsService: PatientsService);
    findAll(): Promise<{
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
    }[]>;
    search(query: string): Promise<{
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
    }[]>;
    findOne(id: string): Promise<({
        consultations: ({
            doctor: {
                name: string;
            };
            prescriptions: {
                id: string;
                createdAt: Date;
                uniqueCode: string;
                medicines: import("@prisma/client/runtime/client").JsonValue;
                instructions: string | null;
                isDelivered: boolean;
                consultationId: string;
            }[];
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
        })[];
        vitals: {
            comments: string | null;
            id: string;
            createdAt: Date;
            temperature: number | null;
            bloodPressure: string | null;
            weight: number | null;
            heartRate: number | null;
            bloodSugar: number | null;
            oxygenSaturation: number | null;
            patientId: string;
            nurseId: string;
        }[];
        bills: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            patientId: string;
            amount: number;
            status: import("@prisma/client").$Enums.BillingStatus;
            paymentMethod: string | null;
            patientShare: number;
            insuranceShare: number;
            transactionId: string | null;
            insuranceValidated: boolean;
            insuranceAuthCode: string | null;
            cashierId: string | null;
        }[];
    } & {
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
    }) | null>;
    create(body: CreatePatientDto): Promise<{
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
    }>;
}
