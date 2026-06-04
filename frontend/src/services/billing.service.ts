import { Bill } from '../types/billing';

export class BillingService {
  constructor(private apiFetch: (path: string, options?: RequestInit) => Promise<any>) {}

  async getBills(): Promise<Bill[]> {
    return this.apiFetch('/billing');
  }

  async createBill(patientId: string, amount: number, specialty?: string): Promise<Bill> {
    return this.apiFetch('/billing', {
      method: 'POST',
      body: JSON.stringify({ patientId, amount, specialty }),
    });
  }

  async payBill(billId: string, paymentMethod: string, transactionId?: string): Promise<Bill> {
    return this.apiFetch(`/billing/pay/${billId}`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, transactionId }),
    });
  }

  async validateInsurance(billId: string, mutuelleName: string, coverageShare: number): Promise<Bill> {
    return this.apiFetch(`/billing/validate-insurance/${billId}`, {
      method: 'POST',
      body: JSON.stringify({ mutuelleName, coverageShare }),
    });
  }

  async createWaveCheckout(billId: string): Promise<{ waveUrl: string }> {
    return this.apiFetch(`/billing/wave/checkout/${billId}`, { method: 'POST' });
  }

  async sendWaveSms(billId: string, phone: string, waveUrl: string): Promise<{ success: boolean }> {
    return this.apiFetch(`/billing/wave/send-sms/${billId}`, {
      method: 'POST',
      body: JSON.stringify({ phone, waveUrl }),
    });
  }

  /**
   * Vérifie le statut d'une session Wave via le backend.
   * Utilisé comme fallback si le webhook WebSocket n'est pas reçu à temps.
   */
  async checkWaveStatus(billId: string): Promise<{ status: string | null; billStatus: string }> {
    return this.apiFetch(`/wave/status/${billId}`);
  }
}
