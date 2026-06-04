import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto } from './dto/verify-2fa.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { DemoLoginDto } from './dto/demo-login.dto.js';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginDto, req: Request): Promise<{
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
    verify2fa(body: Verify2faDto): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    demoLogin(body: DemoLoginDto, req: Request): Promise<{
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
    register(body: RegisterDto): Promise<{
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
