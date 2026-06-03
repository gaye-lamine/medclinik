export declare class WaveService {
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    createCheckoutSession(amount: number, billId: string): Promise<string | null>;
}
