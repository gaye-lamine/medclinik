import { Controller, Post, Get, Param, Req, Res, Headers, Logger, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
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

    // ── 2. Récupérer le body brut ────────────────────────────────────────
    // Priorité : req.rawBody (NestJS rawBody:true) → fallback body re-sérialisé
    // Wave exige le body exactement tel que reçu (espaces, ordre des clés préservés)
    let rawBodyBuffer: Buffer;
    if (req.rawBody && req.rawBody.length > 0) {
      rawBodyBuffer = req.rawBody;
    } else {
      // Fallback : re-sérialiser le body parsé (moins fiable, logué comme warning)
      this.logger.warn('rawBody vide — utilisation du body parsé comme fallback (peut causer échec signature)');
      rawBodyBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    }

    this.logger.log(`Webhook Wave reçu — rawBody length: ${rawBodyBuffer.length}, signature: ${waveSignature?.substring(0, 50)}`);

    // ── 3. Vérifier la signature HMAC SHA-256 ───────────────────────────
    if (!this.verifySignature(secret, waveSignature, rawBodyBuffer)) {
      this.logger.warn(`Signature Webhook Wave invalide — signature reçue : ${waveSignature}`);
      this.logger.warn(`Secret utilisé (premiers 20 chars) : ${secret.substring(0, 20)}...`);
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
      // Wave peut envoyer le statut via payment_status OU via le type d'événement
      const paymentStatus: string = paymentData?.payment_status ?? '';
      const transactionId: string | undefined = paymentData?.transaction_id ?? paymentData?.id;

      this.logger.log(`Webhook Wave reçu — type: ${eventType}, statut: ${paymentStatus}, ref: ${clientReference}`);

      // On ne traite que les références de factures MedClinik
      if (!clientReference.startsWith('bill_')) {
        this.logger.warn(`Référence inconnue ignorée : ${clientReference}`);
        return;
      }

      const billId = clientReference.replace('bill_', '');

      // Déterminer si le paiement est réussi :
      // - via l'event type  : checkout.session.completed
      // - via payment_status: succeeded
      const isSuccess =
        eventType === 'checkout.session.completed' ||
        paymentStatus === 'succeeded';

      // Déterminer si le paiement a échoué :
      // - via l'event type  : checkout.session.payment_failed
      // - via payment_status: failed | cancelled
      const isFailure =
        eventType === 'checkout.session.payment_failed' ||
        paymentStatus === 'failed' ||
        paymentStatus === 'cancelled';

      if (isSuccess) {
        await this.processBillPayment(billId, transactionId);
      } else if (isFailure) {
        this.logger.warn(`Paiement Wave échoué/annulé pour facture ${billId} (type: ${eventType}, statut: ${paymentStatus})`);
        // Ici on pourrait notifier le frontend via WebSocket si besoin
      } else {
        this.logger.log(`Événement Wave ignoré (non actionnable) — type: ${eventType}, statut: ${paymentStatus}`);
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
   *
   * Format header : "t=<unix_timestamp>,v1=<hmac_hex>"
   * Payload signé : timestamp + rawBody (concaténation string, sans séparateur)
   * Référence     : https://docs.wave.com/webhook
   */
  private verifySignature(secret: string, signature: string, rawBody: Buffer): boolean {
    try {
      if (!signature?.includes('t=') || !signature?.includes('v1=')) {
        this.logger.warn('Header Wave-Signature absent ou malformé');
        return false;
      }

      // Extraire timestamp et signature(s) v1
      // Format : "t=1639081943,v1=<hex64>"  (plusieurs v1= possibles lors d'une rotation de clé)
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signatureValues = parts
        .filter((p) => p.startsWith('v1='))
        .map((p) => p.substring(3)); // substring(3) pour éviter split('=') qui casse si '=' dans la valeur

      if (!timestampPart || signatureValues.length === 0) {
        this.logger.warn('Impossible d\'extraire timestamp ou v1 du header Wave-Signature');
        return false;
      }

      const timestamp = timestampPart.substring(2); // "t=<val>" → "<val>"

      // ── Protection replay attack : timestamp < 5 minutes ────────────
      const tsAge = Date.now() - parseInt(timestamp, 10) * 1000;
      if (tsAge > 5 * 60 * 1000) {
        this.logger.warn(`Webhook Wave rejeté : timestamp trop ancien (${Math.round(tsAge / 1000)}s)`);
        return false;
      }

      // ── Calcul HMAC : payload = timestamp + rawBody (string concat) ──
      // Exactement comme la référence PHP Wave :
      //   hash_hmac("sha256", $timestamp . $webhook_body, $wave_webhook_secret)
      const rawBodyString = rawBody.toString('utf8');
      const payloadToSign = timestamp + rawBodyString;
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign, 'utf8')
        .digest('hex');

      this.logger.log(`HMAC calculé (premiers 16 chars) : ${hmac.substring(0, 16)}...`);

      // Comparaison en temps constant contre chaque v1= (support rotation de clé)
      const hmacBuffer = Buffer.from(hmac, 'hex');
      return signatureValues.some((sig) => {
        try {
          const sigBuffer = Buffer.from(sig, 'hex');
          if (sigBuffer.length !== hmacBuffer.length) return false;
          return crypto.timingSafeEqual(sigBuffer, hmacBuffer);
        } catch {
          return false;
        }
      });
    } catch (e: any) {
      this.logger.error(`Erreur vérification signature Wave : ${e.message}`);
      return false;
    }
  }
