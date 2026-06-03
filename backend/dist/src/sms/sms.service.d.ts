export declare class SmsService {
    private readonly logger;
    private readonly login;
    private readonly apiKey;
    private readonly token;
    private readonly senderName;
    private readonly baseUrl;
    private readonly subject;
    constructor();
    private generateSignature;
    private cleanPhoneNumber;
    send(recipient: string, content: string): Promise<boolean>;
}
