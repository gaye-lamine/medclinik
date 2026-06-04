import { Controller, Post, Get, Param, Req, Res, Headers, Logger, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { BillingStatus } from '@prisma/client';
import { BillingService } from '../billing/billing.service.js';
import { WaveService } from './wave.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wave')
@Controller('wave')
export class WaveController {
  private readonly logger = new Logger(WaveController.name);

  // ─── Idempotency : ensemble des factures déjà traitées par webhook ──────
  // Evite le double-paiement si Wave retente le webhook (ex: timeout réseau).
  // En multi-instance, déplacer vers Redis : SET bill:webhook:paid:<billId> EX 86400
  private readonly processedBills = new Set<string>();

  constructor(
    private readonly billingService: BillingService,
    private readonly waveService: WaveService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────
  // Endpoint : Vérification manuelle du statut d'un paiement Wave
  // Utilisé par le frontend en fallback si le webhook n'a pas été reçu.
  // ────────────────────────────────────────────────────────────────────────
  @Get('status/:billId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier manuellement le statut du paiement Wave d\'une facture' })
  @ApiResponse({ status: 200, description: 'Statut retourné' })
  async checkStatus(@Param('billId') billId: string) {
    const bill = await this.billingService.findOne(billId);
    // Cast explicite nécessaire : Prisma infère un type trop étroit via @default(UNPAID)
    const currentStatus = (bill?.status as string) ?? 'NOT_FOUND';

    // Si la facture est déjà marquée comme payée en base, inutile d'interroger Wave
    if (currentStatus === 'PAID') {
      return { status: 'succeeded', billStatus: 'PAID' };
    }

    const waveStatus = await this.waveService.getSessionStatus(billId);

    // Si Wave confirme le paiement mais que la facture n'est pas encore mise à jour
    // (webhook non reçu), on force la mise à jour ici
    if (waveStatus === 'succeeded' && bill && currentStatus !== 'PAID') {
      this.logger.warn(`Webhook manqué pour facture ${billId} — traitement via polling fallback`);
      await this.processBillPayment(billId, undefined);
    }

    return { status: waveStatus, billStatus: currentStatus };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Webhook Wave : réception des événements de paiement en temps réel
  // ────────────────────────────────────────────────────────────────────────
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook Wave CI — réception des événements de paiement' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('wave-signature') waveSignature: string,
  ) {
    // ── 1. Vérifier la présence du secret configuré ─────────────────────
    const secret = process.env.WAVE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('WAVE_WEBHOOK_SECRET non configuré — webhook rejeté.');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // ── 2. Vérifier la présence du rawBody ──────────────────────────────
    if (!req.rawBody) {
      this.logger.error('rawBody manquant — impossible de vérifier la signature.');
      return res.status(400).json({ success: false, message: 'Missing raw body' });
    }

    // ── 3. Vérifier la signature HMAC SHA-256 ───────────────────────────
    if (!this.verifySignature(secret, waveSignature, req.rawBody)) {
      this.logger.warn(`Signature Webhook Wave invalide — signature reçue : ${waveSignature?.substring(0, 30)}...`);
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    // ── 4. Accuser réception immédiatement (Wave exige < 5s) ────────────
    res.status(200).json({ success: true, message: 'Webhook reçu' });

    // ── 5. Traitement asynchrone (après la réponse HTTP) ────────────────
    try {
      const body = req.body as any;
      const eventType: string = body?.type ?? '';
      const paymentData = body?.data ?? {};

      const clientReference: string = paymentData?.client_reference ?? '';
      const paymentStatus: string = paymentData?.payment_status ?? '';
      const transactionId: string | undefined = paymentData?.transaction_id;

      this.logger.log(`Webhook Wave reçu — type: ${eventType}, statut: ${paymentStatus}, ref: ${clientReference}`);

      // On ne traite que les références de factures MedClinik
      if (!clientReference.startsWith('bill_')) {
        this.logger.warn(`Référence inconnue ignorée : ${clientReference}`);
        return;
      }

      const billId = clientReference.replace('bill_', '');

      if (paymentStatus === 'succeeded') {
        await this.processBillPayment(billId, transactionId);
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        this.logger.warn(`Paiement Wave ${paymentStatus} pour facture ${billId}`);
        // Ici on pourrait notifier le frontend via WebSocket si besoin
      }
    } catch (error: any) {
      this.logger.error(`Erreur traitement Webhook Wave : ${error.message}`, error.stack);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Méthodes privées
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Marque la facture comme payée. Protégé contre le double-traitement
   * (idempotency via Set en mémoire — migrer vers Redis en multi-instance).
   */
  private async processBillPayment(billId: string, transactionId?: string): Promise<void> {
    // Idempotency : ignorer si déjà traité dans cette instance
    if (this.processedBills.has(billId)) {
      this.logger.warn(`Facture ${billId} déjà traitée — webhook dupliqué ignoré.`);
      return;
    }

    // Vérifier en base que la facture n'est pas déjà payée
    const existing = await this.billingService.findOne(billId);
    if (existing?.status === 'PAID') {
      this.processedBills.add(billId); // Marquer pour éviter de re-requêter
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

  /**
   * Vérifie la signature HMAC SHA-256 envoyée par Wave.
   * Format attendu du header : "t=<timestamp>,v1=<hmac_hex>"
   */
  private verifySignature(secret: string, signature: string, rawBody: Buffer): boolean {
    try {
      if (!signature?.includes('t=') || !signature?.includes('v1=')) {
        return false;
      }

      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signatureValues = parts
        .filter((p) => p.startsWith('v1='))
        .map((p) => p.split('=')[1]);

      if (!timestampPart || signatureValues.length === 0) {
        return false;
      }

      const timestamp = timestampPart.split('=')[1];

      // ── Protection contre le replay attack : timestamp < 5 minutes ────
      const tsAge = Date.now() - parseInt(timestamp, 10) * 1000;
      if (tsAge > 5 * 60 * 1000) {
        this.logger.warn(`Webhook Wave rejeté : timestamp trop ancien (${Math.round(tsAge / 1000)}s)`);
        return false;
      }

      const payload = Buffer.concat([Buffer.from(timestamp, 'utf8'), rawBody]);
      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return signatureValues.some((sig) =>
        crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(hmac, 'hex')),
      );
    } catch (e: any) {
      this.logger.error(`Erreur vérification signature Wave : ${e.message}`);
      return false;
    }
  }
}
