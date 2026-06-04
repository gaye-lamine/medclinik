import React from 'react';
import { Bill } from '../../types/billing';

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
        <div className="receipt-header">
          <h2>Ticket de Paiement Caisse</h2>
          <button onClick={onClose} className="close-receipt-btn">
            Fermer
          </button>
        </div>

        {/* Receipt Sheet */}
        <div className="receipt-sheet">
          <div className="receipt-clinic-details">
            <h4>MedClinik — ERP Clinique</h4>
            <p>Abidjan, Cocody Mermoz — BP 221</p>
            <p>Tél: +225 07 00 00 00 — Email: contact@medclinik.com</p>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-details">
            <p>
              <strong>FACTURE N°:</strong> {bill.id.substring(0, 8).toUpperCase()}
            </p>
            <p>
              <strong>DATE:</strong> {new Date(bill.createdAt).toLocaleString('fr-FR')}
            </p>
            <p>
              <strong>CAISSIER:</strong> {cashierName}
            </p>
            <p>
              <strong>PATIENT:</strong> {bill.patient.firstName} {bill.patient.lastName} ({bill.patient.code})
            </p>
          </div>

          <div className="receipt-divider"></div>

          <table className="receipt-table">
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem 0' }}>Prestation</th>
                <th style={{ textAlign: 'right', padding: '0.4rem 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.4rem 0' }}>
                  Consultation médicale ({bill.patient.mutuelleName || 'Standard'})
                </td>
                <td style={{ textAlign: 'right', padding: '0.4rem 0' }}>{formatFCFA(bill.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="receipt-divider"></div>

          <div className="receipt-total-block">
            <div className="total-row">
              <span>Montant Total :</span> <span>{formatFCFA(bill.amount)}</span>
            </div>
            {bill.mutuelleName && (
              <>
                <div className="total-row">
                  <span>Part Assurance ({bill.insuranceCoverageShare}%) :</span>{' '}
                  <span>{formatFCFA(bill.insuranceShare)}</span>
                </div>
                <div className="total-row">
                  <span>Prise en charge :</span> <span>{bill.mutuelleName}</span>
                </div>
              </>
            )}
            <div className="total-row net-row">
              <span>NET PAYÉ (PATIENT) :</span> <span>{formatFCFA(bill.patientShare)}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-footer">
            <p>
              Règlement effectué par:{' '}
              <strong>
                {bill.paymentMethod === 'WAVE'
                  ? 'Wave Mobile Money'
                  : bill.paymentMethod === 'CASH'
                  ? 'Espèces'
                  : bill.paymentMethod || 'Wave'}
              </strong>
            </p>
            <p>
              ID Transac: <code>{bill.transactionId || 'N/A'}</code>
            </p>

            <div className="qr-block">
              <div className="mock-barcode">||||| | |||| ||| | || |||| | ||||| | ||</div>
              <div className="mock-qrcode">QR SECURE</div>
            </div>

            <p className="footer-cert">Certifié authentique et exempt de fraudes. MedClinik ERP.</p>
          </div>
        </div>

        <div className="print-action-row">
          <button onClick={() => window.print()} className="btn btn-primary">
            Imprimer la facture
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
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 200;
        }
        .receipt-modal {
          max-width: 500px;
          width: 90%;
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-receipt-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }
        .receipt-sheet {
          background-color: #fff;
          color: #000;
          padding: 2rem;
          border-radius: 8px;
          font-family: monospace;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .receipt-clinic-details {
          text-align: center;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 1rem 0;
        }
        .receipt-details {
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .receipt-table {
          width: 100%;
          font-size: 0.85rem;
          border-collapse: collapse;
        }
        .receipt-total-block {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
        }
        .net-row {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .receipt-footer {
          text-align: center;
          font-size: 0.8rem;
          line-height: 1.4;
          margin-top: 1rem;
        }
        .qr-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          border: 1px solid #000;
          padding: 0.5rem;
        }
        .mock-barcode {
          font-size: 1rem;
          letter-spacing: -2px;
          font-weight: bold;
        }
        .mock-qrcode {
          border: 2px solid #000;
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          font-weight: bold;
        }
        .footer-cert {
          font-size: 0.75rem;
          margin-top: 0.5rem;
          color: #555;
        }
        .print-action-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};
