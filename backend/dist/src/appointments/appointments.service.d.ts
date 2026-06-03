import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
export declare class AppointmentsService {
    private prisma;
    private smsService;
    constructor(prisma: PrismaService, smsService: SmsService);
    findAll(): Promise<({
        patient: {
            id: string;
            code: string;
            firstName: string;
            lastName: string;
        };
        doctor: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
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
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByDoctor(doctorId: string): Promise<({
        patient: {
            id: string;
            code: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(data: {
        patientId: string;
        doctorId: string;
        dateTime: string;
        specialty: string;
        notes?: string;
    }): Promise<{
        patient: {
            id: string;
            firstName: string;
            lastName: string;
        };
        doctor: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        dateTime?: string;
        status?: string;
        specialty?: string;
        notes?: string;
    }): Promise<{
        patient: {
            id: string;
            firstName: string;
            lastName: string;
        };
        doctor: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        status: string;
        specialty: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    admit(id: string, amount?: number): Promise<{
        appointment: {
            patient: {
                id: string;
                code: string;
                firstName: string;
                lastName: string;
            };
            doctor: {
                id: string;
                name: string;
                role: import("@prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            patientId: string;
            doctorId: string;
            dateTime: Date;
            status: string;
            specialty: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        bill: {
            id: string;
            patientId: string;
            status: import("@prisma/client").$Enums.BillingStatus;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            amount: number;
            paymentMethod: string | null;
            patientShare: number;
            insuranceShare: number;
            transactionId: string | null;
            insuranceValidated: boolean;
            insuranceAuthCode: string | null;
            cashierId: string | null;
        };
        consultation: {
            id: string;
            patientId: string;
            doctorId: string;
            status: import("@prisma/client").$Enums.ConsultationStatus;
            specialty: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            diagnosis: string | null;
            vitalsId: string | null;
            billingId: string | null;
        };
    }>;
}
