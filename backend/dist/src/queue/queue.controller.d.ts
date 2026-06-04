import { QueueService } from './queue.service';
import { RegisterQueueDto } from './dto/register-queue.dto';
export declare class QueueController {
    private queueService;
    constructor(queueService: QueueService);
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
    register(body: RegisterQueueDto): Promise<{
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
    call(id: string, req: any): Promise<{
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
