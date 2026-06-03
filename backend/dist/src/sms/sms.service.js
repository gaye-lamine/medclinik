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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let SmsService = SmsService_1 = class SmsService {
    logger = new common_1.Logger(SmsService_1.name);
    login;
    apiKey;
    token;
    senderName;
    baseUrl;
    subject;
    constructor() {
        this.login = process.env.ORANGE_SMS_LOGIN || '';
        this.apiKey = process.env.ORANGE_SMS_API_KEY || '';
        this.token = process.env.ORANGE_SMS_TOKEN || '';
        this.senderName = process.env.ORANGE_SMS_SENDER_NAME || '';
        this.baseUrl =
            process.env.ORANGE_SMS_BASE_URL || 'https://api.orangesmspro.sn:8443/api';
        this.subject = process.env.ORANGE_SMS_SUBJECT || '';
        if (this.login && this.apiKey && this.token) {
            this.logger.log('Service Orange SMS Pro configure et pret');
        }
        else {
            this.logger.warn('Orange SMS Pro : variables manquantes. Les SMS seront simules en mode developpement.');
        }
    }
    generateSignature(recipient, content, timestamp) {
        const msgToEncrypt = this.token + this.subject + this.senderName + recipient + content + timestamp;
        return (0, crypto_1.createHmac)('sha1', this.apiKey).update(msgToEncrypt).digest('hex');
    }
    cleanPhoneNumber(phone) {
        let clean = phone.replace('+', '').replace(/\s/g, '');
        if (clean.startsWith('221') && clean.length > 9) {
            clean = clean.substring(3);
        }
        return clean;
    }
    async send(recipient, content) {
        const cleanRecipient = this.cleanPhoneNumber(recipient);
        if (!this.login || !this.apiKey || !this.token) {
            this.logger.warn(`[SIMULATION SMS] -> ${cleanRecipient} : ${content}`);
            return true;
        }
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const key = this.generateSignature(cleanRecipient, content, timestamp);
            const params = new URLSearchParams({
                token: this.token,
                subject: this.subject,
                signature: this.senderName,
                recipient: cleanRecipient,
                content,
                timestamp: timestamp.toString(),
                key,
            });
            const url = `${this.baseUrl}?${params.toString()}`;
            const auth = Buffer.from(`${this.login}:${this.token}`).toString('base64');
            this.logger.log(`Envoi SMS Orange -> ${cleanRecipient}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: 'application/json',
                },
            });
            const data = (await response.json());
            const apiResult = Array.isArray(data.response) ? data.response[0] : null;
            const statusCode = apiResult
                ? apiResult.status_code
                : data.code || response.status;
            if (statusCode == 200 || statusCode == '200' || data.status === 'success') {
                this.logger.log(`SMS envoye avec succes a ${cleanRecipient}. ID: ${apiResult?.message_id || 'N/A'}`);
                return true;
            }
            else {
                this.logger.error(`Echec SMS Orange: ${JSON.stringify(data)}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(`Erreur SMS Orange: ${error.message}`);
            return false;
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsService);
//# sourceMappingURL=sms.service.js.map