import { ConsultationsService } from './consultations.service';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
export declare class ConsultationsController {
    private consultationsService;
    constructor(consultationsService: ConsultationsService);
    findAll(): Promise<({
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
        } | null;
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
        billing: {
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
        } | null;
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
    })[]>;
    findOne(id: string): Promise<({
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
        } | null;
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
        billing: {
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
        } | null;
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
    }) | null>;
    start(id: string): Promise<{
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
    }>;
    complete(id: string, body: CompleteConsultationDto): Promise<{
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
    }>;
    createPrescription(id: string, body: CreatePrescriptionDto): Promise<{
        id: string;
        createdAt: Date;
        uniqueCode: string;
        medicines: import("@prisma/client/runtime/client").JsonValue;
        instructions: string | null;
        isDelivered: boolean;
        consultationId: string;
    }>;
}
