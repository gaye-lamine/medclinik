import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
export declare class VitalsController {
    private vitalsService;
    constructor(vitalsService: VitalsService);
    create(body: CreateVitalsDto, req: any): Promise<{
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
