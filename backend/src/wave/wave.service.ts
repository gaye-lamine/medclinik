import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';

/**
 * WaveService — Intégration Wave CI (West Africa)
 * API Reference : https://docs.wave.com/
 *
 * Endpoints utilisés :
 *   POST /checkout/sessions   → Créer un lien de paiement
 *   GET  /checkout/sessions/:id → Consulter le statut d'une session
 *
 * Le webhook POST /wave/webhook (WaveController) traite les événements
 * "payment_status" en temps réel avec vérification HMAC SHA-256.
 */
@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = (process.env.WAVE_BASE_URL || 'https://api.wave.com/v1').replace(/\/$/, '');
    this.apiKey = process.env.WAVE_API_KEY || '';

    if (this.apiKey) {
      this.logger.log('Wave CI configuré et prêt.');
    } else {
      this.logger.warn('WAVE_API_KEY manquant — les paiements Wave sont désactivés (mode simulation).');
    }
  }

  // ─── Mode simulation ────────────────────────────────────────────────────
  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Crée une session de paiement Wave Checkout.
   *
   * @param amount       Montant en FCFA (XOF) — part patient uniquement
   * @param billId       ID de la facture MedClinik (sert de client_reference)
   * @returns            URL Wave à envoyer au patient
   * @throws             BadRequestException / InternalServerErrorException
   */
  async createCheckoutSession(amount: number, billId: string): Promise<string> {
    // ── Mode simulation ───────────────────────────────────────────────────
    if (!this.apiKey) {
      this.logger.warn(`[SIMULATION WAVE] Checkout simulé pour facture ${billId} — montant ${amount} XOF`);
      // Retourne une URL fictive pour le développement
      return `https://pay.wave.com/m/simulation?bill=${billId}&amount=${amount}`;
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'https://medclinic.lamine-gaye.tech').replace(/\/$/, '');

    const payload = {
      amount: String(amount),           // Wave CI attend un string
      currency: 'XOF',
      error_url: `${frontendUrl}/caisse?payment=failed&bill_id=${billId}`,
      success_url: `${frontendUrl}/caisse?payment=success&bill_id=${billId}`,
      client_reference: `bill_${billId}`, // Repris tel quel dans le webhook
    };

    this.logger.log(`Création session Wave Checkout — facture ${billId} (${amount} XOF)`);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `checkout-${billId}`, // Evite les doublons si retry
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError: any) {
      this.logger.error(`Erreur réseau Wave : ${networkError.message}`);
      throw new InternalServerErrorException(
        'Impossible de joindre la passerelle Wave. Vérifiez la connexion du serveur.',
      );
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as any;
      const waveMessage = errorBody?.message || errorBody?.error || `HTTP ${response.status}`;
      this.logger.error(`Erreur API Wave (${response.status}) : ${waveMessage} — body complet : ${JSON.stringify(errorBody)}`);

      if (response.status === 400) {
        throw new BadRequestException(`Données de paiement invalides pour Wave : ${waveMessage}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new InternalServerErrorException(`Clé API Wave invalide ou expirée (HTTP ${response.status}) : ${waveMessage}`);
      }
      throw new InternalServerErrorException(`Erreur Wave (${response.status}) : ${waveMessage}`);
    }

    const data = await response.json() as any;
    const waveUrl: string | undefined = data.wave_launch_url;

    if (!waveUrl) {
      this.logger.error('Wave n\'a pas retourné de wave_launch_url', data);
      throw new InternalServerErrorException('Réponse Wave invalide : URL de paiement manquante.');
    }

    this.logger.log(`Session Wave créée — ID: ${data.id}, facture: ${billId}`);
    return waveUrl;
  }

  /**
   * Consulte le statut d'une session Wave par client_reference.
   * Utilisé en fallback si le webhook n'arrive pas.
   *
   * @param billId  ID facture (client_reference = `bill_${billId}`)
   * @returns       'succeeded' | 'failed' | 'cancelled' | 'pending' | null
   */
  async getSessionStatus(billId: string): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/checkout/sessions?client_reference=bill_${billId}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );

      if (!response.ok) {
        this.logger.warn(`Statut Wave introuvable pour facture ${billId} : HTTP ${response.status}`);
        return null;
      }

      const data = await response.json() as any;
      // La liste peut contenir plusieurs sessions — prendre la plus récente
      const sessions: any[] = data?.items ?? (Array.isArray(data) ? data : []);
      if (sessions.length === 0) return null;

      const latest = sessions.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      )[0];

      return latest?.payment_status ?? null;
    } catch (error: any) {
      this.logger.error(`Erreur vérification statut Wave : ${error.message}`);
      return null;
    }
  }
}
