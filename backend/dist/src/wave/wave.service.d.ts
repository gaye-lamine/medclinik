export declare class WaveService {
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    get isConfigured(): boolean;
    createCheckoutSession(amount: number, billId: string): Promise<string>;
    getSessionStatus(billId: string): Promise<string | null>;
}
