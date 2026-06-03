import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
export declare class VitalsService {
    private prisma;
    private queueGateway;
    constructor(prisma: PrismaService, queueGateway: QueueGateway);
    create(nurseId: string, data: any): Promise<{
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
    }>;
    getPatientHistory(patientId: string): Promise<({
        nurse: {
            name: string;
        };
    } & {
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
    })[]>;
}
