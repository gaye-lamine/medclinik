import { Injectable, Logger } from '@nestjs/common';

/**
 * SmsRateLimiterService
 *
 * Garde en mémoire (Map) deux fenêtres glissantes indépendantes :
 *
 *  1. Par IP émettrice (protège contre les bots et scripts malveillants)
 *     → Max 5 SMS / 10 minutes par IP
 *
 *  2. Par numéro de téléphone destinataire (protège le patient contre le spam)
 *     → Max 3 SMS / 60 minutes par numéro destinataire
 *
 * Les compteurs sont automatiquement purgés hors de la fenêtre glissante à
 * chaque appel pour éviter une fuite mémoire.
 *
 * NOTE : En production multi-instance, remplacer par Redis (ioredis + @nestjs/cache-manager).
 */
@Injectable()
export class SmsRateLimiterService {
  private readonly logger = new Logger(SmsRateLimiterService.name);

  // ─── Configuration des quotas ────────────────────────────────────────────
  private readonly BY_IP_MAX = 5;               // max SMS par IP
  private readonly BY_IP_WINDOW_MS = 10 * 60 * 1000;  // fenêtre : 10 minutes

  private readonly BY_PHONE_MAX = 3;            // max SMS par destinataire
  private readonly BY_PHONE_WINDOW_MS = 60 * 60 * 1000; // fenêtre : 1 heure

  // ─── Stockage en mémoire ──────────────────────────────────────────────────
  // Map<clé, tableau de timestamps des envois>
  private readonly byIp = new Map<string, number[]>();
  private readonly byPhone = new Map<string, number[]>();

  /**
   * Vérifie si l'envoi est autorisé.
   * @returns `{ allowed: true }` ou `{ allowed: false, reason: string, retryAfterMs: number }`
   */
  check(ip: string, recipientPhone: string): { allowed: boolean; reason?: string; retryAfterMs?: number } {
    const now = Date.now();

    // ── 1. Fenêtre par IP ─────────────────────────────────────────────────
    const ipResult = this.checkWindow(this.byIp, ip, now, this.BY_IP_WINDOW_MS, this.BY_IP_MAX);
    if (!ipResult.allowed) {
      this.logger.warn(`Rate limit SMS dépassé pour IP ${ip} (${this.BY_IP_MAX} SMS / 10 min)`);
      return {
        allowed: false,
        reason: `Trop de SMS envoyés depuis cette adresse IP. Réessayez dans ${Math.ceil(ipResult.retryAfterMs! / 60000)} minute(s).`,
        retryAfterMs: ipResult.retryAfterMs,
      };
    }

    // ── 2. Fenêtre par numéro destinataire ───────────────────────────────
    const phoneResult = this.checkWindow(this.byPhone, recipientPhone, now, this.BY_PHONE_WINDOW_MS, this.BY_PHONE_MAX);
    if (!phoneResult.allowed) {
      this.logger.warn(`Rate limit SMS dépassé pour destinataire ${recipientPhone} (${this.BY_PHONE_MAX} SMS / 1h)`);
      return {
        allowed: false,
        reason: `Ce numéro a déjà reçu le maximum de SMS autorisés (${this.BY_PHONE_MAX} par heure). Réessayez plus tard.`,
        retryAfterMs: phoneResult.retryAfterMs,
      };
    }

    // ── 3. Enregistrer l'envoi ────────────────────────────────────────────
    this.record(this.byIp, ip, now, this.BY_IP_WINDOW_MS);
    this.record(this.byPhone, recipientPhone, now, this.BY_PHONE_WINDOW_MS);

    return { allowed: true };
  }

  // ─── Méthodes internes ────────────────────────────────────────────────────

  private checkWindow(
    store: Map<string, number[]>,
    key: string,
    now: number,
    windowMs: number,
    max: number,
  ): { allowed: boolean; retryAfterMs?: number } {
    const timestamps = this.purge(store, key, now, windowMs);
    if (timestamps.length >= max) {
      // Le plus ancien timestamp encore dans la fenêtre détermine quand la place se libère
      const oldest = timestamps[0];
      const retryAfterMs = oldest + windowMs - now;
      return { allowed: false, retryAfterMs };
    }
    return { allowed: true };
  }

  private record(store: Map<string, number[]>, key: string, now: number, windowMs: number): void {
    const timestamps = this.purge(store, key, now, windowMs);
    timestamps.push(now);
    store.set(key, timestamps);
  }

  /** Supprime les timestamps expirés et retourne la liste à jour */
  private purge(store: Map<string, number[]>, key: string, now: number, windowMs: number): number[] {
    const cutoff = now - windowMs;
    const existing = store.get(key) ?? [];
    const fresh = existing.filter((ts) => ts > cutoff);
    store.set(key, fresh);
    return fresh;
  }
}
