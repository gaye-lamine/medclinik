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
var WaveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveService = void 0;
const common_1 = require("@nestjs/common");
let WaveService = WaveService_1 = class WaveService {
    logger = new common_1.Logger(WaveService_1.name);
    baseUrl;
    apiKey;
    constructor() {
        this.baseUrl = process.env.WAVE_BASE_URL || 'https://api.wave.com/v1/';
        this.apiKey = process.env.WAVE_API_KEY || '';
    }
    async createCheckoutSession(amount, billId) {
        if (!this.apiKey) {
            this.logger.warn('WAVE_API_KEY non configurée. Impossible de créer une session Wave.');
            return null;
        }
        try {
            this.logger.log(`Création d'une session Wave Checkout pour la facture ${billId} (${amount} XOF)`);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
            const payload = {
                amount: amount,
                currency: 'XOF',
                error_url: `${frontendUrl}/caisse?payment=failed&bill_id=${billId}`,
                success_url: `${frontendUrl}/caisse?payment=success&bill_id=${billId}`,
                client_reference: `bill_${billId}`,
            };
            const response = await fetch(`${this.baseUrl}checkout/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.logger.error(`Erreur création session Wave: ${response.status}`, errorData);
                return null;
            }
            const data = await response.json();
            this.logger.log(`Session Wave Checkout créée : ${data.id}`);
            return data.wave_launch_url;
        }
        catch (error) {
            this.logger.error(`Exception lors de la création de la session Wave: ${error.message}`);
            return null;
        }
    }
};
exports.WaveService = WaveService;
exports.WaveService = WaveService = WaveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WaveService);
//# sourceMappingURL=wave.service.js.map