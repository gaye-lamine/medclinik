import { QueueDepartment } from '@prisma/client';
export declare class RegisterQueueDto {
    patientId: string;
    department: QueueDepartment;
    priority?: string;
    assignedDoctorId?: string;
}
