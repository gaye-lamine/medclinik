import React from 'react';
import { Bill } from '../../types/billing';
import { Logo } from '../Logo';

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
            <Logo size={42} mode="print" />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#000' }}>MedClinik</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>EXCELLENCE & SÉCURITÉ MEDICALE</p>
            </div>
          </div>
          
          <div className="receipt-clinic-details">
            <p>Abidjan, Cocody Mermoz — BP 221</p>
            <p>Tél: +225 07 00 00 00 — Email: contact@medclinik.com</p>
          </div>

          <div className="receipt-divider"></div>

          {/* Receipt Meta Details */}
          <div className="receipt-details-grid">
            <div>
              <span className="meta-label">FACTURE N° :</span>
              <span className="meta-val">{bill.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="meta-label">DATE :</span>
              <span className="meta-val">{new Date(bill.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <div>
              <span className="meta-label">CAISSIER :</span>
              <span className="meta-val">{cashierName}</span>
            </div>
            <div>
              <span className="meta-label">PATIENT :</span>
              <span className="meta-val">{bill.patient.firstName} {bill.patient.lastName} ({bill.patient.code})</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Invoice Table */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem 0', borderBottom: '2px solid #000' }}>Prestation</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0', borderBottom: '2px solid #000' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.6rem 0', fontWeight: 'bold' }}>
                  Consultation médicale {bill.patient.mutuelleName ? `(${bill.patient.mutuelleName})` : ''}
                </td>
                <td style={{ textAlign: 'right', padding: '0.6rem 0', fontWeight: 'bold' }}>
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
                  <span>Part Mutuelle / Assurance ({bill.insuranceCoverageShare}%) :</span>{' '}
                  <span style={{ color: '#000' }}>-{formatFCFA(bill.insuranceShare)}</span>
                </div>
                <div className="total-row">
                  <span>Prise en charge validée :</span> <span style={{ fontWeight: 600 }}>{bill.mutuelleName}</span>
                </div>
              </>
            )}
            <div className="total-row net-row">
              <span>NET À PAYER (PATIENT) :</span> <span className="net-amount">{formatFCFA(bill.patientShare)}</span>
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

            <div className="qr-block">
              <div className="mock-barcode">||||| | |||| ||| | || |||| | ||||| | ||</div>
              <div className="mock-qrcode">QR SECURE</div>
            </div>

            <p className="footer-cert">Document électronique certifié conforme. Système anti-fraude MedClinik.</p>
          </div>
        </div>

        <div className="print-action-row no-print">
          <button onClick={() => window.print()} className="btn btn-primary">
            🖨️ Imprimer la facture
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
          max-width: 480px;
          width: 90%;
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(10, 15, 30, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .receipt-header h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
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
          background-color: #ffffff;
          color: #000000;
          padding: 2.2rem;
          border-radius: 8px;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 1px solid #ddd;
        }
        .receipt-clinic-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin-bottom: 0.5rem;
        }
        .receipt-clinic-details {
          text-align: center;
          font-size: 0.72rem;
          color: #555;
          line-height: 1.4;
          font-weight: 600;
        }
        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 1.25rem 0;
        }
        .receipt-details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #000;
        }
        .meta-label {
          font-weight: bold;
          display: inline-block;
          width: 120px;
        }
        .meta-val {
          font-family: inherit;
        }
        .receipt-table {
          width: 100%;
          font-size: 0.8rem;
          border-collapse: collapse;
          color: #000;
        }
        .receipt-total-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .net-row {
          border-top: 1px solid #000;
          padding-top: 0.5rem;
          margin-top: 0.25rem;
          font-weight: 900;
        }
        .net-amount {
          font-size: 1.2rem;
          text-decoration: underline;
        }
        .receipt-footer {
          text-align: center;
          font-size: 0.75rem;
          color: #000;
          line-height: 1.4;
        }
        .payment-method-desc {
          margin-bottom: 0.25rem;
        }
        .transaction-id-desc {
          font-size: 0.7rem;
          color: #333;
          margin-bottom: 0.5rem;
        }
        .qr-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1.2rem 0;
          border: 1px solid #000;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
        }
        .mock-barcode {
          font-size: 1rem;
          letter-spacing: -1.5px;
          font-weight: bold;
        }
        .mock-qrcode {
          border: 1.5px solid #000;
          padding: 0.25rem 0.4rem;
          font-size: 0.55rem;
          font-weight: 900;
          border-radius: 2px;
          background: #fff;
        }
        .footer-cert {
          font-size: 0.65rem;
          color: #666;
          font-style: italic;
        }
        .print-action-row {
          display: flex;
          justify-content: flex-end;
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
