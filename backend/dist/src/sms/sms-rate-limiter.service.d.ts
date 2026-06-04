import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class SmsRateLimiterService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private redis;
    private isConnected;
    private readonly BY_IP_MAX;
    private readonly BY_IP_WINDOW_SEC;
    private readonly BY_PHONE_MAX;
    private readonly BY_PHONE_WINDOW_SEC;
    private readonly SLIDING_WINDOW_SCRIPT;
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    check(ip: string, recipientPhone: string): Promise<{
        allowed: boolean;
        reason?: string;
        retryAfterMs?: number;
    }>;
    private runWindow;
}
