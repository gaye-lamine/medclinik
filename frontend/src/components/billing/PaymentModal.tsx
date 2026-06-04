import React, { useState, useEffect, useRef } from 'react';
import { Bill } from '../../types/billing';
import { BillingService } from '../../services/billing.service';
import { useToast } from '../ToastContext';

interface PaymentModalProps {
  bill: Bill;
  billingService: BillingService;
  onPaymentSuccess: (paidBill: Bill) => void;
  onClose: () => void;
  formatFCFA: (amount: number) => string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bill,
  billingService,
  onPaymentSuccess,
  onClose,
  formatFCFA,
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('WAVE');
  const [momoPhone, setMomoPhone] = useState(bill.patient?.phoneNumber || '');
  const [waveUrl, setWaveUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync phone number if bill changes
  useEffect(() => {
    if (bill.patient?.phoneNumber) {
      setMomoPhone(bill.patient.phoneNumber);
    }
  }, [bill]);

  // Confirmation temps réel via WebSocket (webhook reçu → bill.status change)
  useEffect(() => {
    if (waveUrl && bill.status === 'PAID') {
      stopPolling();
      toast.success('Paiement Wave confirmé ! La facture a été réglée.');
      onPaymentSuccess(bill);
    }
  }, [bill.status, waveUrl]);

  // Polling fallback : vérifie le statut Wave toutes les 5s
  // si le WebSocket n'a pas reçu l'événement (réseau instable, webhook manqué)
  useEffect(() => {
    if (!waveUrl) {
      stopPolling();
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const result = await billingService.checkWaveStatus(bill.id);
        setPollCount((c) => c + 1);

        if (result.billStatus === 'PAID' || result.status === 'succeeded') {
          stopPolling();
          toast.success('Paiement Wave confirmé via vérification automatique !');
          // Recharger la facture depuis le serveur pour avoir le statut à jour
          const updatedBills = await billingService.getBills();
          const updatedBill = updatedBills.find((b: Bill) => b.id === bill.id);
          if (updatedBill) onPaymentSuccess(updatedBill);
        }
      } catch {
        // Silencieux — le polling continue
      }
    }, 5000); // Vérification toutes les 5 secondes

    return () => stopPolling();
  }, [waveUrl]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsSubmitting(true);

      if (paymentMethod === 'WAVE') {
        const response = await billingService.createWaveCheckout(bill.id);
        setWaveUrl(response.waveUrl);
        return;
      }

      // Cash payment
      const txId = transactionId || `TX-CASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const paidBill = await billingService.payBill(bill.id, 'CASH', txId);
      onPaymentSuccess(paidBill);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du traitement du règlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWaveSms = async () => {
    if (!waveUrl || !momoPhone) {
      toast.warning('Veuillez saisir un numéro de téléphone pour envoyer le SMS.');
      return;
    }

    try {
      setIsSendingSms(true);
      await billingService.sendWaveSms(bill.id, momoPhone, waveUrl);
      toast.success('SMS envoyé avec succès au patient !');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi du SMS.");
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!momoPhone || !waveUrl) {
      toast.warning('Veuillez saisir un numéro de téléphone pour envoyer le lien WhatsApp.');
      return;
    }
    const cleanPhone = momoPhone.replace('+', '').replace(/\s/g, '');
    const defaultPrefix = cleanPhone.startsWith('221') ? '' : '221';
    const message = `Bonjour, veuillez régler votre facture MedClinik de ${bill.patientShare} FCFA en cliquant sur ce lien sécurisé Wave : ${waveUrl}`;
    const waUrl = `https://wa.me/${defaultPrefix}${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up modal-content">
        <h3 className="modal-title">Encaisser un Règlement</h3>

        <div className="checkout-summary">
          <p>Patient : <strong>{bill.patient?.firstName} {bill.patient?.lastName} ({bill.patient?.code})</strong></p>
          <p>Reste à payer : <strong className="patient-share">{formatFCFA(bill.patientShare)}</strong></p>
          {bill.mutuelleName && (
            <p className="insurance-info">
              * Part assurance de {formatFCFA(bill.insuranceShare)} ({bill.insuranceCoverageShare}%) facturée à {bill.mutuelleName}.
            </p>
          )}
        </div>

        {error && (
          <div className="error-alert">
            <strong>Alerte :</strong> {error}
          </div>
        )}

        {waveUrl ? (
          <div className="wave-flow">
            <div className="wave-header">
              <span className="wave-icon">🌊</span>
              <h4>En attente du paiement Wave</h4>
              <div className="wave-status-badge">
                <span className="pulse-dot"></span>
                Vérification en cours{pollCount > 0 ? ` (${pollCount})` : ''}...
              </div>
              <p className="wave-instruction">
                Le patient scanne ce QR code ou reçoit le lien par SMS / WhatsApp.
                Cette fenêtre se ferme automatiquement dès réception du paiement.
              </p>
            </div>

            {/* QR Code généré via Google Charts API (aucune dépendance NPM) */}
            <div className="qr-container">
              <img
                src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(waveUrl)}&choe=UTF-8`}
                alt="QR Code Wave"
                className="wave-qr-code"
                width={200}
                height={200}
              />
              <p className="qr-caption">Scanner avec l&apos;app Wave</p>
            </div>

            <a
              href={waveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary wave-pay-btn"
            >
              Ouvrir le portail Wave ↗
            </a>

            {momoPhone && (
              <div className="share-buttons">
                <button
                  onClick={handleSendWaveSms}
                  disabled={isSendingSms}
                  className="btn sms-btn"
                >
                  {isSendingSms ? 'Envoi...' : '📲 Envoyer par SMS'}
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="btn whatsapp-btn"
                >
                  💬 Envoyer par WhatsApp
                </button>
              </div>
            )}

            <button
              onClick={() => { setWaveUrl(null); stopPolling(); }}
              className="btn btn-secondary cancel-wave-btn"
            >
              Annuler la session Wave
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label className="form-label">Mode de Règlement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select"
              >
                <option value="WAVE">Wave Mobile Money</option>
                <option value="CASH">Espèces (Cash)</option>
              </select>
            </div>

            {paymentMethod === 'WAVE' && (
              <div className="form-group">
                <label className="form-label">Numéro de téléphone Wave du Client</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 77 000 00 00"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {paymentMethod === 'WAVE' ? 'Référence de Transaction Wave' : 'Numéro de Reçu / Référence (Facultatif)'}
              </label>
              <input
                type="text"
                placeholder={paymentMethod === 'WAVE' ? 'Générée automatiquement si vide' : 'Automatique si vide'}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                Annuler
              </button>
              <button type="submit" className="btn btn-success submit-btn" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Traitement...'
                  : paymentMethod === 'WAVE'
                  ? 'Générer le Lien Wave'
                  : 'Confirmer le Règlement Cash'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backgroundColor: rgba(5, 8, 16, 0.85);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          zIndex: 200;
        }
        .modal-content {
          max-width: 500px;
          width: 90%;
          padding: 2rem;
          border-radius: 16px;
        }
        .modal-title {
          margin-bottom: 1.25rem;
          color: var(--primary-color);
        }
        .checkout-summary {
          background-color: var(--primary-glow);
          border: 1px solid var(--primary-color);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .patient-share {
          color: var(--warning);
          font-size: 1.2rem;
        }
        .insurance-info {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .error-alert {
          background-color: var(--danger-glow);
          border: 1px solid var(--danger);
          color: #fff;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .wave-flow {
          text-align: center;
          padding: 1rem 0;
        }
        .wave-header {
          margin-bottom: 1.5rem;
        }
        .wave-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .wave-instruction {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          line-height: 1.4;
        }
        .wave-pay-btn {
          display: inline-block;
          width: 100%;
          margin-bottom: 1rem;
          padding: 0.85rem;
          font-size: 1rem;
          text-align: center;
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.25rem;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .wave-qr-code {
          border-radius: 8px;
          border: 4px solid white;
        }
        .qr-caption {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
        }
        .wave-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 168, 255, 0.12);
          border: 1px solid rgba(0, 168, 255, 0.3);
          color: #00a8ff;
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          margin: 0.5rem auto 0.75rem;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #00a8ff;
          border-radius: 50%;
          animation: pulse-wave 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-wave {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .share-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .sms-btn {
          flex: 1;
          background-color: #ff7900;
          color: white;
          border: none;
        }
        .sms-btn:hover {
          background-color: #e66d00;
        }
        .whatsapp-btn {
          flex: 1;
          background-color: #25d366;
          color: white;
          border: none;
        }
        .whatsapp-btn:hover {
          background-color: #20ba5a;
        }
        .cancel-wave-btn {
          width: 100%;
        }
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .submit-btn {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};
