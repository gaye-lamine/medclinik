import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BillingService } from '../billing/billing.service.js';
import { WaveService } from './wave.service.js';
export declare class WaveController {
    private readonly billingService;
    private readonly waveService;
    private readonly logger;
    private readonly processedBills;
    constructor(billingService: BillingService, waveService: WaveService);
    checkStatus(billId: string): Promise<{
        status: string | null;
        billStatus: string;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, res: Response, waveSignature: string): Promise<Response<any, Record<string, any>> | undefined>;
    private processBillPayment;
    private verifySignature;
}
