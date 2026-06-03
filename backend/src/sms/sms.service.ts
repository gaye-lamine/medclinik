import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

/**
 * Service SMS via Orange SMS Pro Sénégal
 * API : https://api.orangesmspro.sn:8443/api
 * Adapté depuis fayal-backend (orange_sms_service.ts)
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly login: string;
  private readonly apiKey: string;
  private readonly token: string;
  private readonly senderName: string;
  private readonly baseUrl: string;
  private readonly subject: string;

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
    } else {
      this.logger.warn(
        'Orange SMS Pro : variables manquantes. Les SMS seront simules en mode developpement.',
      );
    }
  }

  private generateSignature(
    recipient: string,
    content: string,
    timestamp: number,
  ): string {
    const msgToEncrypt =
      this.token + this.subject + this.senderName + recipient + content + timestamp;
    return createHmac('sha1', this.apiKey).update(msgToEncrypt).digest('hex');
  }

  private cleanPhoneNumber(phone: string): string {
    let clean = phone.replace('+', '').replace(/\s/g, '');
    if (clean.startsWith('221') && clean.length > 9) {
      clean = clean.substring(3);
    }
    return clean;
  }

  /**
   * Envoie un SMS via Orange SMS Pro Senegal.
   * C'est la seule methode publique — tous les contextes passent par ici.
   */
  async send(recipient: string, content: string): Promise<boolean> {
    const cleanRecipient = this.cleanPhoneNumber(recipient);

    // Mode simulation si credentials manquants (developpement)
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

      const data = (await response.json()) as any;
      const apiResult = Array.isArray(data.response) ? data.response[0] : null;
      const statusCode = apiResult
        ? apiResult.status_code
        : data.code || response.status;

      if (statusCode == 200 || statusCode == '200' || data.status === 'success') {
        this.logger.log(
          `SMS envoye avec succes a ${cleanRecipient}. ID: ${apiResult?.message_id || 'N/A'}`,
        );
        return true;
      } else {
        this.logger.error(`Echec SMS Orange: ${JSON.stringify(data)}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`Erreur SMS Orange: ${error.message}`);
      return false;
    }
  }
}
