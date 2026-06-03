import { PrismaService } from '../prisma/prisma.service';
export declare class FilesController {
    private prisma;
    constructor(prisma: PrismaService);
    uploadFile(patientId: string, file: any, consultationId?: string, customName?: string): Promise<{
        url: string;
        id: string;
        name: string;
        patientId: string;
        consultationId: string | null;
        type: string;
        size: number;
        uploadedAt: Date;
    }>;
    getFiles(patientId: string): Promise<{
        url: string;
        id: string;
        name: string;
        patientId: string;
        consultationId: string | null;
        type: string;
        size: number;
        uploadedAt: Date;
    }[]>;
}
