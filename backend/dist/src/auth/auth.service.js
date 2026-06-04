"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const sms_service_js_1 = require("../sms/sms.service.js");
const sms_rate_limiter_service_js_1 = require("../sms/sms-rate-limiter.service.js");
const crypto_1 = require("crypto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    smsService;
    smsRateLimiter;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, smsService, smsRateLimiter) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.smsService = smsService;
        this.smsRateLimiter = smsRateLimiter;
    }
    async validateUser(email, pass) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && user.isActive) {
            const isMatch = await bcrypt.compare(pass, user.password);
            if (isMatch) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }
    async findUserByEmailForDemo(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async login(user, callerIp = '0.0.0.0') {
        const isDemo = user.email.toLowerCase().endsWith('@medclinik.com') || user.email.toLowerCase() === 'lifesonou@gmail.com';
        if (isDemo) {
            const payload = {
                email: user.email,
                sub: user.id,
                role: user.role,
                name: user.name,
                is2faComplete: true,
            };
            return {
                requires2fa: false,
                accessToken: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            };
        }
        if (user.phone) {
            const rateLimitCheck = await this.smsRateLimiter.check(callerIp, user.phone);
            if (!rateLimitCheck.allowed) {
                throw new common_1.HttpException(rateLimitCheck.reason ?? 'Trop de tentatives. Réessayez plus tard.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const secret = process.env.JWT_SECRET || 'medclinik_secret_key_2026_super_secure';
        const hashedOtp = (0, crypto_1.createHash)('sha256').update(otp + secret).digest('hex');
        if (user.phone) {
            const message = `Votre code de validation MedClinik est : ${otp}. Ne le partagez jamais.`;
            this.smsService
                .send(user.phone, message)
                .then((success) => {
                if (success) {
                    this.logger.log(`2FA OTP SMS sent successfully to ${user.phone}`);
                }
                else {
                    this.logger.error(`Failed to send 2FA OTP SMS to ${user.phone}`);
                }
            })
                .catch((err) => {
                this.logger.error(`Error sending 2FA OTP SMS: ${err.message}`);
            });
        }
        else {
            this.logger.warn(`User ${user.email} has no phone number. Cannot send OTP.`);
        }
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            name: user.name,
            hashedOtp,
            is2faComplete: false,
        };
        return {
            requires2fa: true,
            email: user.email,
            phone: user.phone || 'N/A',
            tempToken: this.jwtService.sign(payload, { expiresIn: '10m' }),
        };
    }
    async verifyOtp(tempToken, code) {
        try {
            const decoded = this.jwtService.verify(tempToken);
            const secret = process.env.JWT_SECRET || 'medclinik_secret_key_2026_super_secure';
            const computedHash = (0, crypto_1.createHash)('sha256').update(code + secret).digest('hex');
            const isDev = process.env.NODE_ENV !== 'production';
            const isBypass = isDev && (code === '123456' || code === '000000');
            const isValidOtp = decoded.hashedOtp === computedHash || isBypass;
            if (isValidOtp) {
                const payload = {
                    email: decoded.email,
                    sub: decoded.sub,
                    role: decoded.role,
                    name: decoded.name,
                    is2faComplete: true,
                };
                return {
                    accessToken: this.jwtService.sign(payload),
                    user: {
                        id: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        role: decoded.role,
                    },
                };
            }
            throw new common_1.UnauthorizedException('Code OTP incorrect');
        }
        catch (e) {
            if (e instanceof common_1.UnauthorizedException) {
                throw e;
            }
            throw new common_1.UnauthorizedException('Token de session invalide ou expiré');
        }
    }
    async register(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role,
                phone: data.phone || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                createdAt: true,
            },
        });
    }
    async findAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteUser(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        jwt_1.JwtService,
        sms_service_js_1.SmsService,
        sms_rate_limiter_service_js_1.SmsRateLimiterService])
], AuthService);
//# sourceMappingURL=auth.service.js.map