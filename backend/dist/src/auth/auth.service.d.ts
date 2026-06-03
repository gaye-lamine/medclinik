import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private smsService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, smsService: SmsService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        requires2fa: boolean;
        email: any;
        phone: any;
        tempToken: string;
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
    register(data: any): Promise<{
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
