"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_js_1 = require("./auth.service.js");
const jwt_auth_guard_js_1 = require("./jwt-auth.guard.js");
const roles_decorator_js_1 = require("./roles.decorator.js");
const client_1 = require("@prisma/client");
const login_dto_js_1 = require("./dto/login.dto.js");
const verify_2fa_dto_js_1 = require("./dto/verify-2fa.dto.js");
const register_dto_js_1 = require("./dto/register.dto.js");
const demo_login_dto_js_1 = require("./dto/demo-login.dto.js");
const swagger_1 = require("@nestjs/swagger");
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(body, req) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Identifiants de connexion invalides');
        }
        return this.authService.login(user, getClientIp(req));
    }
    async verify2fa(body) {
        return this.authService.verifyOtp(body.tempToken, body.code);
    }
    async demoLogin(body, req) {
        const enableDemo = process.env.ENABLE_DEMO === 'true' || process.env.NODE_ENV !== 'production';
        if (!enableDemo) {
            throw new common_1.UnauthorizedException('Le mode démonstration rapide est désactivé');
        }
        const roleEmails = {
            ADMIN: 'admin@medclinik.com',
            DOCTOR: 'doctor@medclinik.com',
            NURSE: 'nurse@medclinik.com',
            CASHIER: 'cashier@medclinik.com',
        };
        const email = roleEmails[body.role];
        const user = await this.authService.findUserByEmailForDemo(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur de démonstration introuvable');
        }
        return this.authService.login(user, getClientIp(req));
    }
    async register(body) {
        return this.authService.register(body);
    }
    async findAllUsers() {
        return this.authService.findAllUsers();
    }
    async deleteUser(id) {
        return this.authService.deleteUser(id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Connexion de l\'utilisateur (génère l\'envoi OTP)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'OTP envoyé au téléphone de l\'utilisateur, tempToken retourné' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Identifiants incorrects' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Quota SMS dépassé — réessayez plus tard' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_js_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-2fa'),
    (0, swagger_1.ApiOperation)({ summary: 'Vérifier le code OTP de la double authentification' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Jeton JWT final et profil utilisateur retournés' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Code OTP ou session invalide' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_2fa_dto_js_1.Verify2faDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2fa", null);
__decorate([
    (0, common_1.Post)('demo-login'),
    (0, swagger_1.ApiOperation)({ summary: 'Connexion de démonstration rapide (désactivée en production)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Initialise la connexion démo avec OTP généré' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Mode démo désactivé' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Quota SMS dépassé' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [demo_login_dto_js_1.DemoLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "demoLogin", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, roles_decorator_js_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer un nouveau collaborateur' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Collaborateur enregistré avec succès' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_js_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, roles_decorator_js_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lister tous les collaborateurs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des utilisateurs récupérée' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, roles_decorator_js_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Désactiver/supprimer un collaborateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur supprimé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteUser", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map