'use client';

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

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    position: 'relative' as const,
    width: '90%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '16px',
    padding: '2.5rem 2rem 2.2rem 2rem',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
    maxHeight: '88vh',
    overflowY: 'auto' as const,
    fontFamily: "'Courier New', Courier, monospace",
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.1rem',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    color: '#4b5563',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  clinicHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.4rem',
    textAlign: 'center' as const,
    marginTop: '0.5rem',
  },
  clinicTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#000000',
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  clinicSubtitle: {
    fontSize: '0.7rem',
    color: '#4b5563',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.5px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  clinicDetails: {
    textAlign: 'center' as const,
    fontSize: '0.72rem',
    color: '#4b5563',
    lineHeight: 1.4,
    margin: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  divider: {
    borderTop: '1px dashed #374151',
    margin: '0.2rem 0',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
    fontSize: '0.78rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline' as const,
  },
  detailLabel: {
    fontWeight: 'bold' as const,
  },
  detailValue: {
    textAlign: 'right' as const,
  },
  table: {
    width: '100%',
    fontSize: '0.78rem',
    borderCollapse: 'collapse' as const,
  },
  thLeft: {
    textAlign: 'left' as const,
    padding: '0.4rem 0',
    borderBottom: '1.5px solid #000000',
    fontWeight: 'bold' as const,
  },
  thRight: {
    textAlign: 'right' as const,
    padding: '0.4rem 0',
    borderBottom: '1.5px solid #000000',
    fontWeight: 'bold' as const,
  },
  tdLeft: {
    padding: '0.5rem 0',
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
  },
  tdRight: {
    padding: '0.5rem 0',
    fontWeight: 'bold' as const,
    textAlign: 'right' as const,
  },
  totalsBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.4rem',
    fontSize: '0.78rem',
  },
  netRow: {
    borderTop: '1.5px double #000000',
    borderBottom: '1.5px double #000000',
    padding: '0.5rem 0',
    marginTop: '0.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 'bold' as const,
  },
  netLabel: {
    fontSize: '0.95rem',
  },
  netVal: {
    fontSize: '1.15rem',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '0.72rem',
    lineHeight: 1.4,
  },
  verificationArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.25rem 0',
  },
  qrcodeContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
  },
  qrcode: {
    width: '80px',
    height: '80px',
    border: '1px solid #000000',
    padding: '2px',
    backgroundColor: '#ffffff',
  },
  qrCaption: {
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#4b5563',
    margin: 0,
    fontWeight: 600,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  barcode: {
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    letterSpacing: '2px',
    fontWeight: 'bold' as const,
  },
  footerCert: {
    fontSize: '0.65rem',
    color: '#4b5563',
    fontStyle: 'italic' as const,
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  btnSecondary: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }
};

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
    <div style={styles.overlay}>
      <div style={styles.modal} className="receipt-modal-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          style={styles.closeBtn}
          className="no-print"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Fermer"
        >
          ✕
        </button>

        {/* Clinic Header */}
        <div style={styles.clinicHeader}>
          <Logo size={44} mode="print" />
          <h3 style={styles.clinicTitle}>MedClinik</h3>
          <p style={styles.clinicSubtitle}>EXCELLENCE & SÉCURITÉ MEDICALE</p>
        </div>

        <div style={styles.clinicDetails}>
          <p style={{ margin: 0 }}>Abidjan, Cocody Mermoz — BP 221</p>
          <p style={{ margin: 0 }}>Tél: +225 07 00 00 00 — Email: contact@medclinik.com</p>
        </div>

        <div style={styles.divider}></div>

        {/* Receipt Meta Details */}
        <div style={styles.detailsList}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>FACTURE N° :</span>
            <span style={styles.detailValue}>{bill.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>DATE :</span>
            <span style={styles.detailValue}>{new Date(bill.createdAt).toLocaleString('fr-FR')}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>CAISSIER :</span>
            <span style={styles.detailValue}>{cashierName}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>PATIENT :</span>
            <span style={styles.detailValue}>
              {bill.patient?.firstName} {bill.patient?.lastName} ({bill.patient?.code})
            </span>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* Invoice Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thLeft}>Prestation</th>
              <th style={styles.thRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.tdLeft}>
                Consultation médicale {bill.patient?.mutuelleName ? `(${bill.patient.mutuelleName})` : ''}
              </td>
              <td style={styles.tdRight}>
                {formatFCFA(bill.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={styles.divider}></div>

        {/* Totals Block */}
        <div style={styles.totalsBlock}>
          <div style={styles.detailRow}>
            <span>Montant Brut :</span> <span>{formatFCFA(bill.amount)}</span>
          </div>
          {bill.mutuelleName && (
            <>
              <div style={styles.detailRow}>
                <span>Part Mutuelle ({bill.insuranceCoverageShare}%) :</span>{' '}
                <span>-{formatFCFA(bill.insuranceShare)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={{ fontStyle: 'italic', color: '#4b5563' }}>Prise en charge :</span>
                <span style={{ fontStyle: 'italic', color: '#4b5563' }}>{bill.mutuelleName}</span>
              </div>
            </>
          )}
          <div style={styles.netRow}>
            <span style={styles.netLabel}>NET À PAYER :</span>
            <span style={styles.netVal}>{formatFCFA(bill.patientShare)}</span>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* Payment Method / Security Verification */}
        <div style={styles.footer}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.78rem' }}>
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
            <p style={{ fontSize: '0.7rem', color: '#4b5563', margin: '0 0 0.5rem 0' }}>
              Réf Transaction : <code>{bill.transactionId}</code>
            </p>
          )}

          <div style={styles.verificationArea}>
            {qrUrl && (
              <div style={styles.qrcodeContainer}>
                <img src={qrUrl} alt="QR Code" style={styles.qrcode} />
                <p style={styles.qrCaption}>Scanner pour authentifier</p>
              </div>
            )}
            <div style={styles.barcode}>
              ||||| | |||| ||| | || |||| | ||||| | ||
            </div>
          </div>

          <p style={styles.footerCert}>Document électronique certifié conforme. Système anti-fraude MedClinik.</p>
        </div>

        <div style={styles.actionRow} className="no-print">
          <button
            onClick={() => { generateReceiptPDF(bill, cashierName, formatFCFA).catch(console.error); }}
            style={styles.btnPrimary}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            📥 Télécharger PDF
          </button>
          <button
            onClick={() => window.print()}
            style={styles.btnSecondary}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      <style jsx>{`
        .receipt-modal-card::-webkit-scrollbar {
          width: 6px;
        }
        .receipt-modal-card::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }
        .receipt-modal-card::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 8px;
        }
        .receipt-modal-card::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }

        /* ─── PRINT SPECIFIC OVERRIDES ───────────────────────────────────────── */
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
