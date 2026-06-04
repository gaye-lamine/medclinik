"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsRateLimiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsRateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let SmsRateLimiterService = SmsRateLimiterService_1 = class SmsRateLimiterService {
    logger = new common_1.Logger(SmsRateLimiterService_1.name);
    redis;
    isConnected = false;
    BY_IP_MAX = 5;
    BY_IP_WINDOW_SEC = 10 * 60;
    BY_PHONE_MAX = 3;
    BY_PHONE_WINDOW_SEC = 60 * 60;
    SLIDING_WINDOW_SCRIPT = `
    local key      = KEYS[1]
    local now      = tonumber(ARGV[1])
    local window   = tonumber(ARGV[2])
    local max      = tonumber(ARGV[3])
    local cutoff   = now - window

    -- Supprimer les entrées expirées (score < cutoff)
    redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)

    -- Compter les entrées restantes dans la fenêtre
    local count = redis.call('ZCARD', key)

    if count >= max then
      -- Retourner le plus ancien timestamp pour calculer retryAfter
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      return { count, tonumber(oldest[2]) or now }
    end

    -- Enregistrer cet envoi (score = timestamp, member = timestamp unique)
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    -- TTL = durée de la fenêtre + 10s de marge
    redis.call('EXPIRE', key, math.ceil(window / 1000) + 10)

    return { count + 1, -1 }
  `;
    onModuleInit() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            connectTimeout: 5000,
            commandTimeout: 3000,
            retryStrategy: (times) => {
                if (times > 5) {
                    this.logger.error('Redis : impossible de se connecter après 5 tentatives. Mode fail-open actif.');
                    return null;
                }
                return Math.min(times * 500, 3000);
            },
        });
        this.redis.on('connect', () => {
            this.isConnected = true;
            this.logger.log(`SmsRateLimiter connecté à Redis : ${redisUrl}`);
        });
        this.redis.on('error', (err) => {
            this.isConnected = false;
            this.logger.warn(`Redis indisponible — mode fail-open actif : ${err.message}`);
        });
        this.redis.on('close', () => {
            this.isConnected = false;
        });
        this.redis.connect().catch(() => {
        });
    }
    async onModuleDestroy() {
        await this.redis?.quit().catch(() => { });
    }
    async check(ip, recipientPhone) {
        if (!this.isConnected) {
            this.logger.warn(`[fail-open] Redis indisponible — envoi SMS autorisé sans vérification de quota pour ${ip}`);
            return { allowed: true };
        }
        try {
            const ipResult = await this.runWindow(`sms:ip:${ip}`, this.BY_IP_WINDOW_SEC * 1000, this.BY_IP_MAX);
            if (!ipResult.allowed) {
                this.logger.warn(`Rate limit SMS dépassé pour IP ${ip}`);
                return {
                    allowed: false,
                    reason: `Trop de SMS envoyés depuis cette adresse. Réessayez dans ${Math.ceil(ipResult.retryAfterMs / 60000)} minute(s).`,
                    retryAfterMs: ipResult.retryAfterMs,
                };
            }
            const phoneResult = await this.runWindow(`sms:phone:${recipientPhone}`, this.BY_PHONE_WINDOW_SEC * 1000, this.BY_PHONE_MAX);
            if (!phoneResult.allowed) {
                this.logger.warn(`Rate limit SMS dépassé pour destinataire ${recipientPhone}`);
                return {
                    allowed: false,
                    reason: `Ce numéro a déjà reçu le maximum de SMS autorisés (${this.BY_PHONE_MAX}/heure). Réessayez plus tard.`,
                    retryAfterMs: phoneResult.retryAfterMs,
                };
            }
            return { allowed: true };
        }
        catch (err) {
            this.logger.error(`Erreur Redis inattendue dans SmsRateLimiter : ${err.message} — fail-open`);
            return { allowed: true };
        }
    }
    async runWindow(key, windowMs, max) {
        const now = Date.now();
        const result = (await this.redis.eval(this.SLIDING_WINDOW_SCRIPT, 1, key, now.toString(), windowMs.toString(), max.toString()));
        const [count, oldestTs] = result;
        if (oldestTs !== -1) {
            const retryAfterMs = oldestTs + windowMs - now;
            return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
        }
        return { allowed: true };
    }
};
exports.SmsRateLimiterService = SmsRateLimiterService;
exports.SmsRateLimiterService = SmsRateLimiterService = SmsRateLimiterService_1 = __decorate([
    (0, common_1.Injectable)()
], SmsRateLimiterService);
//# sourceMappingURL=sms-rate-limiter.service.js.map