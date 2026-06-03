import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';
import { SmsService } from '../sms/sms.service';
export declare class QueueService {
    private prisma;
    private queueGateway;
    private smsService;
    constructor(prisma: PrismaService, queueGateway: QueueGateway, smsService: SmsService);
    getQueue(): Promise<({
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
        assignedDoctor: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    register(data: any): Promise<{
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
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    call(id: string, doctorId?: string): Promise<{
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
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
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
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    finish(id: string): Promise<{
        success: boolean;
    }>;
}
