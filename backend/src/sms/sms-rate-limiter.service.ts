import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * SmsRateLimiterService — Fenêtre glissante via Redis
 *
 * Utilise un Sorted Set Redis par clé (IP ou numéro de téléphone).
 * Chaque envoi SMS est stocké avec son timestamp comme score.
 * Un script Lua atomique expire les anciens membres et compte les
 * entrées dans la fenêtre courante — garantissant l'atomicité même
 * en environnement multi-instance / multi-conteneur.
 *
 * Clés Redis :
 *   sms:ip:<ip>     → fenêtre par IP émettrice   (5 max / 10 min)
 *   sms:phone:<tel> → fenêtre par destinataire    (3 max / 1 heure)
 *
 * En cas d'indisponibilité de Redis (timeout, connexion perdue), le
 * service passe en mode "fail-open" : l'envoi SMS est autorisé pour
 * ne pas bloquer l'application. L'erreur est loggée comme alerte.
 */
@Injectable()
export class SmsRateLimiterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsRateLimiterService.name);
  private redis: Redis;
  private isConnected = false;

  // ─── Quotas ────────────────────────────────────────────────────────────
  private readonly BY_IP_MAX = 5;
  private readonly BY_IP_WINDOW_SEC = 10 * 60;   // 10 minutes

  private readonly BY_PHONE_MAX = 3;
  private readonly BY_PHONE_WINDOW_SEC = 60 * 60; // 1 heure

  // ─── Script Lua : sliding window atomique ──────────────────────────────
  // KEYS[1] = clé Redis (ex: "sms:ip:1.2.3.4")
  // ARGV[1] = timestamp courant (ms)
  // ARGV[2] = taille de la fenêtre (ms)
  // ARGV[3] = quota max
  // Retourne : { count_actuel, oldest_timestamp_in_window | -1 }
  private readonly SLIDING_WINDOW_SCRIPT = `
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
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      commandTimeout: 3000,
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.error('Redis : impossible de se connecter après 5 tentatives. Mode fail-open actif.');
          return null; // Stoppe les retries
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
      // L'erreur est déjà loggée par le handler 'error'
    });
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => {});
  }

  /**
   * Vérifie si l'envoi est autorisé.
   * @returns `{ allowed: true }` ou `{ allowed: false, reason, retryAfterMs }`
   */
  async check(
    ip: string,
    recipientPhone: string,
  ): Promise<{ allowed: boolean; reason?: string; retryAfterMs?: number }> {
    // ── Fail-open si Redis indisponible ───────────────────────────────────
    if (!this.isConnected) {
      this.logger.warn(`[fail-open] Redis indisponible — envoi SMS autorisé sans vérification de quota pour ${ip}`);
      return { allowed: true };
    }

    try {
      // ── 1. Vérification par IP émettrice ─────────────────────────────
      const ipResult = await this.runWindow(
        `sms:ip:${ip}`,
        this.BY_IP_WINDOW_SEC * 1000,
        this.BY_IP_MAX,
      );
      if (!ipResult.allowed) {
        this.logger.warn(`Rate limit SMS dépassé pour IP ${ip}`);
        return {
          allowed: false,
          reason: `Trop de SMS envoyés depuis cette adresse. Réessayez dans ${Math.ceil(ipResult.retryAfterMs! / 60000)} minute(s).`,
          retryAfterMs: ipResult.retryAfterMs,
        };
      }

      // ── 2. Vérification par numéro destinataire ───────────────────────
      const phoneResult = await this.runWindow(
        `sms:phone:${recipientPhone}`,
        this.BY_PHONE_WINDOW_SEC * 1000,
        this.BY_PHONE_MAX,
      );
      if (!phoneResult.allowed) {
        this.logger.warn(`Rate limit SMS dépassé pour destinataire ${recipientPhone}`);
        return {
          allowed: false,
          reason: `Ce numéro a déjà reçu le maximum de SMS autorisés (${this.BY_PHONE_MAX}/heure). Réessayez plus tard.`,
          retryAfterMs: phoneResult.retryAfterMs,
        };
      }

      return { allowed: true };
    } catch (err: any) {
      // Fail-open sur toute erreur Redis inattendue
      this.logger.error(`Erreur Redis inattendue dans SmsRateLimiter : ${err.message} — fail-open`);
      return { allowed: true };
    }
  }

  // ─── Exécute le script Lua sur une clé donnée ─────────────────────────
  private async runWindow(
    key: string,
    windowMs: number,
    max: number,
  ): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const now = Date.now();
    const result = (await this.redis.eval(
      this.SLIDING_WINDOW_SCRIPT,
      1,
      key,
      now.toString(),
      windowMs.toString(),
      max.toString(),
    )) as [number, number];

    const [count, oldestTs] = result;

    if (oldestTs !== -1) {
      // Le quota était déjà atteint (script n'a pas enregistré l'entrée)
      const retryAfterMs = oldestTs + windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    return { allowed: true };
  }
}
