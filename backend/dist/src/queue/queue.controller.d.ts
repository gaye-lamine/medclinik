import { QueueService } from './queue.service';
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
        patientId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        priority: string;
        department: import("@prisma/client").$Enums.QueueDepartment;
        assignedDoctorId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    register(body: any): Promise<{
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
