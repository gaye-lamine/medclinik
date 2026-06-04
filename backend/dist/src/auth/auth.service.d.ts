import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service.js';
import { SmsRateLimiterService } from '../sms/sms-rate-limiter.service.js';
import { RegisterDto } from './dto/register.dto.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    private smsService;
    private smsRateLimiter;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, smsService: SmsService, smsRateLimiter: SmsRateLimiterService);
    validateUser(email: string, pass: string): Promise<any>;
    findUserByEmailForDemo(email: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    login(user: any, callerIp?: string): Promise<{
        requires2fa: boolean;
        accessToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
        email?: undefined;
        phone?: undefined;
        tempToken?: undefined;
    } | {
        requires2fa: boolean;
        email: any;
        phone: any;
        tempToken: string;
        accessToken?: undefined;
        user?: undefined;
    }>;
    verifyOtp(tempToken: string, code: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    register(data: RegisterDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        createdAt: Date;
    }>;
    findAllUsers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    deleteUser(id: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
