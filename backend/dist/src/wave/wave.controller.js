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
const throttler_1 = require("@nestjs/throttler");
const crypto = __importStar(require("crypto"));
const billing_service_js_1 = require("../billing/billing.service.js");
const wave_service_js_1 = require("./wave.service.js");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const swagger_1 = require("@nestjs/swagger");
let WaveController = WaveController_1 = class WaveController {
    billingService;
    waveService;
    logger = new common_1.Logger(WaveController_1.name);
    processedBills = new Set();
    constructor(billingService, waveService) {
        this.billingService = billingService;
        this.waveService = waveService;
    }
    async checkStatus(billId) {
        const bill = await this.billingService.findOne(billId);
        const currentStatus = bill?.status ?? 'NOT_FOUND';
        if (currentStatus === 'PAID') {
            return { status: 'succeeded', billStatus: 'PAID' };
        }
        const waveStatus = await this.waveService.getSessionStatus(billId);
        if (waveStatus === 'succeeded' && bill && currentStatus !== 'PAID') {
            this.logger.warn(`Webhook manqué pour facture ${billId} — traitement via polling fallback`);
            await this.processBillPayment(billId, undefined);
        }
        return { status: waveStatus, billStatus: currentStatus };
    }
    async handleWebhook(req, res, waveSignature) {
        const secret = process.env.WAVE_WEBHOOK_SECRET;
        if (!secret) {
            this.logger.error('WAVE_WEBHOOK_SECRET non configuré — webhook rejeté.');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }
        let rawBodyBuffer;
        if (req.rawBody && req.rawBody.length > 0) {
            rawBodyBuffer = req.rawBody;
        }
        else {
            this.logger.warn('rawBody vide — utilisation du body parsé comme fallback (peut causer échec signature)');
            rawBodyBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
        }
        this.logger.log(`Webhook Wave reçu — rawBody length: ${rawBodyBuffer.length}, signature: ${waveSignature?.substring(0, 50)}`);
        if (!this.verifySignature(secret, waveSignature, rawBodyBuffer)) {
            this.logger.warn(`Signature Webhook Wave invalide — signature reçue : ${waveSignature}`);
            this.logger.warn(`Secret utilisé (premiers 20 chars) : ${secret.substring(0, 20)}...`);
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }
        res.status(200).json({ success: true, message: 'Webhook reçu' });
        try {
            const body = req.body;
            const eventType = body?.type ?? '';
            const paymentData = body?.data ?? {};
            const clientReference = paymentData?.client_reference ?? '';
            const paymentStatus = paymentData?.payment_status ?? '';
            const transactionId = paymentData?.transaction_id ?? paymentData?.id;
            this.logger.log(`Webhook Wave reçu — type: ${eventType}, statut: ${paymentStatus}, ref: ${clientReference}`);
            if (!clientReference.startsWith('bill_')) {
                this.logger.warn(`Référence inconnue ignorée : ${clientReference}`);
                return;
            }
            const billId = clientReference.replace('bill_', '');
            const isSuccess = eventType === 'checkout.session.completed' ||
                paymentStatus === 'succeeded';
            const isFailure = eventType === 'checkout.session.payment_failed' ||
                paymentStatus === 'failed' ||
                paymentStatus === 'cancelled';
            if (isSuccess) {
                await this.processBillPayment(billId, transactionId);
            }
            else if (isFailure) {
                this.logger.warn(`Paiement Wave échoué/annulé pour facture ${billId} (type: ${eventType}, statut: ${paymentStatus})`);
            }
            else {
                this.logger.log(`Événement Wave ignoré (non actionnable) — type: ${eventType}, statut: ${paymentStatus}`);
            }
        }
        catch (error) {
            this.logger.error(`Erreur traitement Webhook Wave : ${error.message}`, error.stack);
        }
    }
    async processBillPayment(billId, transactionId) {
        if (this.processedBills.has(billId)) {
            this.logger.warn(`Facture ${billId} déjà traitée — webhook dupliqué ignoré.`);
            return;
        }
        const existing = await this.billingService.findOne(billId);
        if (existing?.status === 'PAID') {
            this.processedBills.add(billId);
            this.logger.warn(`Facture ${billId} déjà payée en base — webhook ignoré.`);
            return;
        }
        await this.billingService.pay(billId, null, {
            paymentMethod: 'MOBILE_MONEY_WAVE',
            transactionId: transactionId ?? `WAVE-${billId}`,
        });
        this.processedBills.add(billId);
        this.logger.log(`✅ Facture ${billId} marquée comme payée via Wave (transactionId: ${transactionId ?? 'N/A'})`);
    }
    verifySignature(secret, signature, rawBody) {
        try {
            if (!signature?.includes('t=') || !signature?.includes('v1=')) {
                this.logger.warn('Header Wave-Signature absent ou malformé');
                return false;
            }
            const parts = signature.split(',');
            const timestampPart = parts.find((p) => p.startsWith('t='));
            const signatureValues = parts
                .filter((p) => p.startsWith('v1='))
                .map((p) => p.substring(3));
            if (!timestampPart || signatureValues.length === 0) {
                this.logger.warn('Impossible d\'extraire timestamp ou v1 du header Wave-Signature');
                return false;
            }
            const timestamp = timestampPart.substring(2);
            const tsAge = Date.now() - parseInt(timestamp, 10) * 1000;
            if (tsAge > 5 * 60 * 1000) {
                this.logger.warn(`Webhook Wave rejeté : timestamp trop ancien (${Math.round(tsAge / 1000)}s)`);
                return false;
            }
            const rawBodyString = rawBody.toString('utf8');
            const payloadToSign = timestamp + rawBodyString;
            const hmac = crypto
                .createHmac('sha256', secret)
                .update(payloadToSign, 'utf8')
                .digest('hex');
            this.logger.log(`HMAC calculé (premiers 16 chars) : ${hmac.substring(0, 16)}...`);
            const hmacBuffer = Buffer.from(hmac, 'hex');
            return signatureValues.some((sig) => {
                try {
                    const sigBuffer = Buffer.from(sig, 'hex');
                    if (sigBuffer.length !== hmacBuffer.length)
                        return false;
                    return crypto.timingSafeEqual(sigBuffer, hmacBuffer);
                }
                catch {
                    return false;
                }
            });
        }
        catch (e) {
            this.logger.error(`Erreur vérification signature Wave : ${e.message}`);
            return false;
        }
    }
};
exports.WaveController = WaveController;
__decorate([
    (0, common_1.Get)('status/:billId'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Vérifier manuellement le statut du paiement Wave d\'une facture' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut retourné' }),
    __param(0, (0, common_1.Param)('billId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WaveController.prototype, "checkStatus", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook Wave CI — réception des événements de paiement' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('wave-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WaveController.prototype, "handleWebhook", null);
exports.WaveController = WaveController = WaveController_1 = __decorate([
    (0, swagger_1.ApiTags)('Wave'),
    (0, common_1.Controller)('wave'),
    __metadata("design:paramtypes", [billing_service_js_1.BillingService,
        wave_service_js_1.WaveService])
], WaveController);
//# sourceMappingURL=wave.controller.js.map