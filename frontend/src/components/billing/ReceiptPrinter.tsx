import React, { useState, useEffect } from 'react';
import { Bill } from '../../types/billing';
import { Logo } from '../Logo';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import QRCode from 'qrcode';

interface ReceiptPrinterProps {
  bill: Bill;
  cashierName: string;
  onClose: () => void;
  formatFCFA: (amount: number) => string;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  bill,
  cashierName,
  onClose,
  formatFCFA,
}) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const method = bill.paymentMethod === 'WAVE' || bill.paymentMethod === 'MOBILE_MONEY_WAVE' ? 'Wave' : 'Especes';
    const qrText = `MEDCLINIK SECURE RECEIPT\nID: ${bill.id}\nPatient: ${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}\nNet: ${bill.patientShare} FCFA\nMode: ${method}\nDate: ${new Date(bill.createdAt).toLocaleDateString('fr-FR')}`;
    QRCode.toDataURL(qrText, { margin: 1, width: 100 })
      .then((url) => setQrUrl(url))
      .catch(console.error);
  }, [bill]);
  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up receipt-modal">
        <div className="receipt-header no-print">
          <h2>Ticket de Paiement Caisse</h2>
          <button onClick={onClose} className="close-receipt-btn">
            ✕ Fermer
          </button>
        </div>

        {/* Receipt Sheet */}
        <div className="receipt-sheet">
          {/* Clinic Header */}
          <div className="receipt-clinic-header">
            <Logo size={48} mode="print" />
            <h3 className="receipt-clinic-title">MedClinik</h3>
            <p className="receipt-clinic-subtitle">EXCELLENCE & SÉCURITÉ MEDICALE</p>
          </div>
          
          <div className="receipt-clinic-details">
            <p>Abidjan, Cocody Mermoz — BP 221</p>
            <p>Tél: +225 07 00 00 00 — Email: contact@medclinik.com</p>
          </div>

          <div className="receipt-divider"></div>

          {/* Receipt Meta Details */}
          <div className="receipt-details-list">
            <div className="receipt-detail-row">
              <span className="receipt-detail-label">FACTURE N° :</span>
              <span className="receipt-detail-value">{bill.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="receipt-detail-row">
              <span className="receipt-detail-label">DATE :</span>
              <span className="receipt-detail-value">{new Date(bill.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <div className="receipt-detail-row">
              <span className="receipt-detail-label">CAISSIER :</span>
              <span className="receipt-detail-value">{cashierName}</span>
            </div>
            <div className="receipt-detail-row">
              <span className="receipt-detail-label">PATIENT :</span>
              <span className="receipt-detail-value">
                {bill.patient?.firstName} {bill.patient?.lastName} ({bill.patient?.code})
              </span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Invoice Table */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th className="receipt-th-left">Prestation</th>
                <th className="receipt-th-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="receipt-td-left">
                  Consultation médicale {bill.patient?.mutuelleName ? `(${bill.patient.mutuelleName})` : ''}
                </td>
                <td className="receipt-td-right">
                  {formatFCFA(bill.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="receipt-divider"></div>

          {/* Totals Block */}
          <div className="receipt-total-block">
            <div className="total-row">
              <span>Montant Brut :</span> <span>{formatFCFA(bill.amount)}</span>
            </div>
            {bill.mutuelleName && (
              <>
                <div className="total-row">
                  <span>Part Mutuelle ({bill.insuranceCoverageShare}%) :</span>{' '}
                  <span>-{formatFCFA(bill.insuranceShare)}</span>
                </div>
                <div className="total-row insurance-note">
                  <span>Prise en charge :</span> <span>{bill.mutuelleName}</span>
                </div>
              </>
            )}
            <div className="receipt-net-row">
              <span className="net-label">NET À PAYER :</span>
              <span className="net-val">{formatFCFA(bill.patientShare)}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Payment Method / Security Verification */}
          <div className="receipt-footer">
            <p className="payment-method-desc">
              Paiement validé par :{' '}
              <strong>
                {bill.paymentMethod === 'WAVE' || bill.paymentMethod === 'MOBILE_MONEY_WAVE'
                  ? 'Wave Mobile Money'
                  : bill.paymentMethod === 'CASH'
                  ? 'Espèces'
                  : bill.paymentMethod || 'Wave'}
              </strong>
            </p>
            {bill.transactionId && (
              <p className="transaction-id-desc">
                Réf Transaction : <code>{bill.transactionId}</code>
              </p>
            )}

            <div className="receipt-verification-area">
              {qrUrl && (
                <div className="receipt-qrcode-container">
                  <img src={qrUrl} alt="QR Code" className="receipt-qrcode" />
                  <p className="qr-caption">Scanner pour authentifier</p>
                </div>
              )}
              <div className="receipt-barcode">
                ||||| | |||| ||| | || |||| | ||||| | ||
              </div>
            </div>

            <p className="footer-cert">Document électronique certifié conforme. Système anti-fraude MedClinik.</p>
          </div>
        </div>

        <div className="print-action-row no-print" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => { generateReceiptPDF(bill, cashierName, formatFCFA).catch(console.error); }}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            📥 Télécharger PDF
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>
            🖨️ Imprimer
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(5, 8, 16, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .receipt-modal {
          max-width: 450px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: rgba(10, 15, 30, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
        }
        .receipt-modal::-webkit-scrollbar {
          width: 6px;
        }
        .receipt-modal::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        .receipt-modal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        .receipt-modal::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .receipt-header h2 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .close-receipt-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: color 0.2s;
        }
        .close-receipt-btn:hover {
          color: #fff;
        }
        .receipt-sheet {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #000000 !important;
          padding: 2rem 1.75rem;
          border-radius: 12px;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid #ddd;
        }
        .receipt-sheet * {
          color: #000000 !important;
          background-color: transparent !important;
          background: transparent !important;
        }
        .receipt-clinic-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .receipt-clinic-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #000;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .receipt-clinic-subtitle {
          font-size: 0.7rem;
          color: #666;
          font-weight: bold;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .receipt-clinic-details {
          text-align: center;
          font-size: 0.72rem;
          color: #555;
          line-height: 1.45;
          font-weight: 600;
        }
        .receipt-clinic-details p {
          margin: 0;
        }
        .receipt-divider {
          border-top: 1px dashed #000 !important;
          margin: 1.25rem 0;
          height: 0;
        }
        .receipt-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.78rem;
          color: #000;
        }
        .receipt-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .receipt-detail-label {
          font-weight: bold;
        }
        .receipt-detail-value {
          text-align: right;
        }
        .receipt-table {
          width: 100%;
          font-size: 0.78rem;
          border-collapse: collapse;
          color: #000;
        }
        .receipt-th-left {
          text-align: left;
          padding: 0.4rem 0;
          border-bottom: 1.5px solid #000;
          font-weight: bold;
        }
        .receipt-th-right {
          text-align: right;
          padding: 0.4rem 0;
          border-bottom: 1.5px solid #000;
          font-weight: bold;
        }
        .receipt-td-left {
          padding: 0.5rem 0;
          font-weight: bold;
          text-align: left;
        }
        .receipt-td-right {
          padding: 0.5rem 0;
          font-weight: bold;
          text-align: right;
        }
        .receipt-total-block {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
        }
        .insurance-note {
          font-style: italic;
          color: #333;
        }
        .receipt-net-row {
          border-top: 1.5px double #000;
          border-bottom: 1.5px double #000;
          padding: 0.5rem 0;
          margin-top: 0.25rem;
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }
        .net-label {
          font-size: 0.95rem;
        }
        .net-val {
          font-size: 1.15rem;
        }
        .receipt-footer {
          text-align: center;
          font-size: 0.72rem;
          color: #000;
          line-height: 1.4;
        }
        .payment-method-desc {
          margin: 0 0 0.25rem 0;
          font-size: 0.78rem;
        }
        .transaction-id-desc {
          font-size: 0.7rem;
          color: #333;
          margin: 0 0 0.5rem 0;
        }
        .receipt-verification-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .receipt-qrcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .receipt-qrcode {
          width: 80px;
          height: 80px;
          border: 1px solid #000;
          padding: 2px;
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        .qr-caption {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #555;
          margin: 0;
          font-weight: 600;
        }
        .receipt-barcode {
          font-family: monospace;
          font-size: 1.1rem;
          letter-spacing: 2px;
          color: #000;
          font-weight: bold;
        }
        .footer-cert {
          font-size: 0.65rem;
          color: #666;
          font-style: italic;
          margin: 0;
        }
        .print-action-row {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          padding-top: 0.25rem;
        }

        /* ─── PRINT SPECIFIC OVERRIDES ───────────────────────────────────────── */
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            display: block !important;
            z-index: 999999 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            width: 100% !important;
          }
          .receipt-modal {
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
