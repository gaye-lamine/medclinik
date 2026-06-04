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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
    }>;
    finish(id: string): Promise<{
        success: boolean;
    }>;
}
