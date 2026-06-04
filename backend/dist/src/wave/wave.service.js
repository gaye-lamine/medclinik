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
        this.baseUrl = (process.env.WAVE_BASE_URL || 'https://api.wave.com/v1').replace(/\/$/, '');
        this.apiKey = process.env.WAVE_API_KEY || '';
        if (this.apiKey) {
            this.logger.log('Wave CI configuré et prêt.');
        }
        else {
            this.logger.warn('WAVE_API_KEY manquant — les paiements Wave sont désactivés (mode simulation).');
        }
    }
    get isConfigured() {
        return !!this.apiKey;
    }
    async createCheckoutSession(amount, billId) {
        if (!this.apiKey) {
            this.logger.warn(`[SIMULATION WAVE] Checkout simulé pour facture ${billId} — montant ${amount} XOF`);
            return `https://pay.wave.com/m/simulation?bill=${billId}&amount=${amount}`;
        }
        const frontendUrl = (process.env.FRONTEND_URL || 'https://medclinic.lamine-gaye.tech').replace(/\/$/, '');
        const payload = {
            amount: String(amount),
            currency: 'XOF',
            error_url: `${frontendUrl}/caisse?payment=failed&bill_id=${billId}`,
            success_url: `${frontendUrl}/caisse?payment=success&bill_id=${billId}`,
            client_reference: `bill_${billId}`,
        };
        this.logger.log(`Création session Wave Checkout — facture ${billId} (${amount} XOF)`);
        let response;
        try {
            response = await fetch(`${this.baseUrl}/checkout/sessions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Idempotency-Key': `checkout-${billId}`,
                },
                body: JSON.stringify(payload),
            });
        }
        catch (networkError) {
            this.logger.error(`Erreur réseau Wave : ${networkError.message}`);
            throw new common_1.InternalServerErrorException('Impossible de joindre la passerelle Wave. Vérifiez la connexion du serveur.');
        }
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const waveMessage = errorBody?.message || errorBody?.error || `HTTP ${response.status}`;
            this.logger.error(`Erreur API Wave (${response.status}) : ${waveMessage}`, errorBody);
            if (response.status === 400) {
                throw new common_1.BadRequestException(`Données de paiement invalides pour Wave : ${waveMessage}`);
            }
            if (response.status === 401 || response.status === 403) {
                throw new common_1.InternalServerErrorException('Clé API Wave invalide ou expirée. Contactez l\'administrateur.');
            }
            throw new common_1.InternalServerErrorException(`Erreur Wave (${response.status}) : ${waveMessage}`);
        }
        const data = await response.json();
        const waveUrl = data.wave_launch_url;
        if (!waveUrl) {
            this.logger.error('Wave n\'a pas retourné de wave_launch_url', data);
            throw new common_1.InternalServerErrorException('Réponse Wave invalide : URL de paiement manquante.');
        }
        this.logger.log(`Session Wave créée — ID: ${data.id}, facture: ${billId}`);
        return waveUrl;
    }
    async getSessionStatus(billId) {
        if (!this.apiKey) {
            return null;
        }
        try {
            const response = await fetch(`${this.baseUrl}/checkout/sessions?client_reference=bill_${billId}`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            if (!response.ok) {
                this.logger.warn(`Statut Wave introuvable pour facture ${billId} : HTTP ${response.status}`);
                return null;
            }
            const data = await response.json();
            const sessions = data?.items ?? (Array.isArray(data) ? data : []);
            if (sessions.length === 0)
                return null;
            const latest = sessions.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())[0];
            return latest?.payment_status ?? null;
        }
        catch (error) {
            this.logger.error(`Erreur vérification statut Wave : ${error.message}`);
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