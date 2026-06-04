import { Injectable, Logger } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.WAVE_BASE_URL || 'https://api.wave.com/v1/';
    this.apiKey = process.env.WAVE_API_KEY || '';
  }

  async createCheckoutSession(amount: number, billId: string): Promise<string | null> {
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

    } catch (error: any) {
      this.logger.error(`Exception lors de la création de la session Wave: ${error.message}`);
      return null;
    }
  }
}
