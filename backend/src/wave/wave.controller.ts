import { Controller, Post, Req, Res, Headers, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { BillingService } from '../billing/billing.service';

@Controller('wave')
export class WaveController {
  private readonly logger = new Logger(WaveController.name);

  constructor(private readonly billingService: BillingService) {}

  private verifySignature(secret: string, signature: string, rawBody: Buffer): boolean {
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
    } catch (e) {
      this.logger.error('Erreur lors de la vérification de la signature Wave', e);
      return false;
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('wave-signature') waveSignature: string,
  ) {
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

    // Acknowledge receipt of the webhook to Wave
    res.status(200).json({ message: 'OK' });

    // Process webhook
    try {
      const data = req.body;
      const clientReference = data?.data?.client_reference;
      const paymentStatus = data?.data?.payment_status; // 'succeeded', 'failed', 'cancelled'
      const transactionId = data?.data?.transaction_id;

      if (!clientReference || !clientReference.startsWith('bill_')) {
        return;
      }

      const billId = clientReference.replace('bill_', '');
      this.logger.log(`Webhook reçu pour la facture ${billId} : statut = ${paymentStatus}`);

      if (paymentStatus === 'succeeded') {
        // Enregistrer le paiement dans la base de données
        // L'utilisateur 'WaveSystem' ou on passe null pour le cashier car c'est automatique
        // Mais billingService.pay attend un cashierId. On passera 'SYSTEM_WAVE'
        await this.billingService.pay(billId, 'SYSTEM_WAVE', {
          paymentMethod: 'MOBILE_MONEY_WAVE',
          transactionId: transactionId,
        });
        this.logger.log(`Facture ${billId} marquée comme payée avec succès via Wave.`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur traitement Webhook Wave: ${error.message}`);
    }
  }
}
