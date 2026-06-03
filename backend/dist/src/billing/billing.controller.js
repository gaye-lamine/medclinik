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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const wave_service_1 = require("../wave/wave.service");
const sms_service_1 = require("../sms/sms.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let BillingController = class BillingController {
    billingService;
    waveService;
    smsService;
    constructor(billingService, waveService, smsService) {
        this.billingService = billingService;
        this.waveService = waveService;
        this.smsService = smsService;
    }
    async findAll() {
        return this.billingService.findAll();
    }
    async findOne(id) {
        return this.billingService.findOne(id);
    }
    async calculateShare(body) {
        return this.billingService.calculateShare(body.patientId, parseFloat(body.amount));
    }
    async create(body) {
        return this.billingService.create(body);
    }
    async pay(id, body, req) {
        const cashierId = req.user.sub;
        return this.billingService.pay(id, cashierId, body);
    }
    async validateInsurance(id, body) {
        return this.billingService.validateInsurance(id, body);
    }
    async createWaveCheckout(id) {
        const bill = await this.billingService.findOne(id);
        if (!bill) {
            throw new Error('Facture introuvable');
        }
        const waveUrl = await this.waveService.createCheckoutSession(bill.patientShare, id);
        if (!waveUrl) {
            throw new Error('Impossible de générer le lien Wave');
        }
        return { waveUrl };
    }
    async sendWaveSms(id, body) {
        const bill = await this.billingService.findOne(id);
        if (!bill) {
            throw new Error('Facture introuvable');
        }
        const message = `Bonjour, veuillez regler votre facture MedClinik de ${bill.patientShare} FCFA en cliquant sur ce lien sécurisé Wave: ${body.waveUrl}`;
        const success = await this.smsService.send(body.phone, message);
        if (!success) {
            throw new Error("L'envoi du SMS a échoué.");
        }
        return { success: true };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('calculate-share'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "calculateShare", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('pay/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)('validate-insurance/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "validateInsurance", null);
__decorate([
    (0, common_1.Post)('wave/checkout/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createWaveCheckout", null);
__decorate([
    (0, common_1.Post)('wave/send-sms/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "sendWaveSms", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        wave_service_1.WaveService,
        sms_service_1.SmsService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map