import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BillingService } from '../billing/billing.service';
export declare class WaveController {
    private readonly billingService;
    private readonly logger;
    constructor(billingService: BillingService);
    private verifySignature;
    handleWebhook(req: RawBodyRequest<Request>, res: Response, waveSignature: string): Promise<Response<any, Record<string, any>> | undefined>;
}
