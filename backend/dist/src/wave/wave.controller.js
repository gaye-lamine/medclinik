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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WaveController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const billing_service_1 = require("../billing/billing.service");
let WaveController = WaveController_1 = class WaveController {
    billingService;
    logger = new common_1.Logger(WaveController_1.name);
    constructor(billingService) {
        this.billingService = billingService;
    }
    verifySignature(secret, signature, rawBody) {
        try {
            if (!signature || !signature.includes('t=') || !signature.includes('v1=')) {
                return false;
            }
            const parts = signature.split(',');
            const timestampPart = parts.find((part) => part.startsWith('t='));
            const signatures = parts
                .filter((part) => part.startsWith('v1='))
                .map((part) => part.split('=')[1]);
            if (!timestampPart || signatures.length === 0) {
                return false;
            }
            const timestamp = timestampPart.split('=')[1];
            const payload = Buffer.concat([Buffer.from(timestamp, 'utf8'), rawBody]);
            const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
            return signatures.includes(hmac);
        }
        catch (e) {
            this.logger.error('Erreur lors de la vérification de la signature Wave', e);
            return false;
        }
    }
    async handleWebhook(req, res, waveSignature) {
        const secret = process.env.WAVE_WEBHOOK_SECRET;
        if (!secret) {
            this.logger.error('WAVE_WEBHOOK_SECRET non configuré.');
            return res.status(500).json({ message: 'Configuration error' });
        }
        if (!req.rawBody) {
            this.logger.error('rawBody manquant, impossible de vérifier la signature Webhook.');
            return res.status(400).json({ message: 'rawBody missing' });
        }
        const isValid = this.verifySignature(secret, waveSignature, req.rawBody);
        if (!isValid) {
            this.logger.warn('Signature Webhook Wave invalide.');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.status(200).json({ message: 'OK' });
        try {
            const data = req.body;
            const clientReference = data?.data?.client_reference;
            const paymentStatus = data?.data?.payment_status;
            const transactionId = data?.data?.transaction_id;
            if (!clientReference || !clientReference.startsWith('bill_')) {
                return;
            }
            const billId = clientReference.replace('bill_', '');
            this.logger.log(`Webhook reçu pour la facture ${billId} : statut = ${paymentStatus}`);
            if (paymentStatus === 'succeeded') {
                await this.billingService.pay(billId, null, {
                    paymentMethod: 'MOBILE_MONEY_WAVE',
                    transactionId: transactionId,
                });
                this.logger.log(`Facture ${billId} marquée comme payée avec succès via Wave.`);
            }
        }
        catch (error) {
            this.logger.error(`Erreur traitement Webhook Wave: ${error.message}`);
        }
    }
};
exports.WaveController = WaveController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('wave-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WaveController.prototype, "handleWebhook", null);
exports.WaveController = WaveController = WaveController_1 = __decorate([
    (0, common_1.Controller)('wave'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], WaveController);
//# sourceMappingURL=wave.controller.js.map