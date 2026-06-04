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
const calculate_share_dto_1 = require("./dto/calculate-share.dto");
const create_billing_dto_1 = require("./dto/create-billing.dto");
const pay_billing_dto_1 = require("./dto/pay-billing.dto");
const validate_insurance_dto_1 = require("./dto/validate-insurance.dto");
const send_wave_sms_dto_1 = require("./dto/send-wave-sms.dto");
const swagger_1 = require("@nestjs/swagger");
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
        const bill = await this.billingService.findOne(id);
        if (!bill) {
            throw new common_1.NotFoundException('Facture introuvable');
        }
        return bill;
    }
    async calculateShare(body) {
        return this.billingService.calculateShare(body.patientId, body.amount);
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
            throw new common_1.NotFoundException('Facture introuvable');
        }
        const waveUrl = await this.waveService.createCheckoutSession(bill.patientShare, id);
        if (!waveUrl) {
            throw new common_1.BadRequestException('Impossible de générer le lien de paiement Wave');
        }
        return { waveUrl };
    }
    async sendWaveSms(id, body) {
        const bill = await this.billingService.findOne(id);
        if (!bill) {
            throw new common_1.NotFoundException('Facture introuvable');
        }
        const message = `Bonjour, veuillez regler votre facture MedClinik de ${bill.patientShare} FCFA en cliquant sur ce lien sécurisé Wave: ${body.waveUrl}`;
        const success = await this.smsService.send(body.phone, message);
        if (!success) {
            throw new common_1.BadRequestException("L'envoi du SMS de facturation a échoué.");
        }
        return { success: true };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Liste de toutes les factures' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Factures récupérées' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Détails d\'une facture' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Facture trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Facture introuvable' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('calculate-share'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Calculer la répartition mutuelle / patient d\'un montant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calcul effectué' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_share_dto_1.CalculateShareDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "calculateShare", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une nouvelle facture et initialiser une consultation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Facture créée avec succès' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_billing_dto_1.CreateBillingDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('pay/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer le règlement d\'une facture' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Facture réglée avec succès' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_billing_dto_1.PayBillingDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)('validate-insurance/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Valider manuellement la prise en charge assurance/mutuelle' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assurance validée' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validate_insurance_dto_1.ValidateInsuranceDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "validateInsurance", null);
__decorate([
    (0, common_1.Post)('wave/checkout/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un lien de paiement Wave Mobile Money' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session Wave initialisée avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Facture introuvable' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createWaveCheckout", null);
__decorate([
    (0, common_1.Post)('wave/send-sms/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CASHIER, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Envoyer le lien de paiement Wave par SMS au patient' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SMS envoyé avec succès' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_wave_sms_dto_1.SendWaveSmsDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "sendWaveSms", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('Billing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        wave_service_1.WaveService,
        sms_service_1.SmsService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map