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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        notes: string | null;
        specialty: string;
        doctorId: string;
        dateTime: Date;
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
            createdAt: Date;
            updatedAt: Date;
            patientId: string;
            status: string;
            notes: string | null;
            specialty: string;
            doctorId: string;
            dateTime: Date;
        };
        bill: {
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
        };
        consultation: {
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
    }>;
}
