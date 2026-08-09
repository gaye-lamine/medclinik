import React from 'react';
import { Bill } from '../../types/billing';

interface BillsTableProps {
  bills: Bill[];
  validatingId: string | null;
  onValidateInsurance: (billId: string, mutuelleName: string, coverageShare: number) => void;
  onSelectBill: (bill: Bill) => void;
  onPrintInvoice: (bill: Bill) => void;
  formatFCFA: (amount: number) => string;
}

// ─── Badge config par statut ────────────────────────────────────────────────
type BillStatus = Bill['status'];

const STATUS_CONFIG: Record<BillStatus, { label: string; cssClass: string }> = {
  UNPAID:          { label: 'Impayé',    cssClass: 'badge-unpaid' },
  PAID:            { label: 'Réglé',     cssClass: 'badge-paid' },
  PARTIALLY_PAID:  { label: 'Partiel',   cssClass: 'badge-partial' },
  CANCELLED:       { label: 'Annulé',    cssClass: 'badge-cancelled' },
  REFUNDED:        { label: 'Remboursé', cssClass: 'badge-refunded' },
};

export const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  validatingId,
  onValidateInsurance,
  onSelectBill,
  onPrintInvoice,
  formatFCFA,
}) => {
  return (
    <div className="glass-card">
      <h3>Grand Livre des Transactions Caisse</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        La liste complète des factures en attente et réglées. Les dossiers sont débloqués en temps réel.
      </p>

      <div style={{ width: '100%', overflowX: 'auto', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th className="table-th">Patient</th>
              <th className="table-th">Date</th>
              <th className="table-th">Assurance / Mutuelle</th>
              <th className="table-th">Total</th>
              <th className="table-th">Part Patient</th>
              <th className="table-th">Versé / Reste</th>
              <th className="table-th">Part Assureur</th>
              <th className="table-th">Statut</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => {
              const config = STATUS_CONFIG[bill.status] ?? { label: bill.status, cssClass: 'badge-unpaid' };
              const amountPaid = bill.amountPaid ?? 0;
              const remainingBalance = bill.patientShare - amountPaid;

              return (
                <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    <strong>{bill.patient?.firstName} {bill.patient?.lastName}</strong> <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bill.patient?.code}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    {new Date(bill.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    {bill.mutuelleName ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>{bill.mutuelleName} ({bill.insuranceCoverageShare}%)</span>
                        {bill.insuranceValidated ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                            Validé ✓ ({bill.insuranceAuthCode})
                          </span>
                        ) : (
                          <button
                            onClick={() => onValidateInsurance(bill.id, bill.mutuelleName || '', bill.insuranceCoverageShare)}
                            disabled={validatingId === bill.id}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: 'fit-content' }}
                          >
                            {validatingId === bill.id ? 'Vérification en cours...' : 'Valider la prise en charge'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Aucune (100% Cash)</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>{formatFCFA(bill.amount)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--warning)', fontWeight: 'bold' }}>
                    {formatFCFA(bill.patientShare)}
                  </td>

                  {/* Colonne Versé / Reste — pertinente pour PARTIALLY_PAID et PAID */}
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {bill.status === 'PARTIALLY_PAID' && (
                      <span style={{ color: 'var(--warning)' }}>
                        {formatFCFA(amountPaid)}<br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reste : {formatFCFA(remainingBalance)}
                        </span>
                      </span>
                    )}
                    {bill.status === 'PAID' && (
                      <span style={{ color: 'var(--success)' }}>{formatFCFA(bill.patientShare)}</span>
                    )}
                    {(bill.status === 'UNPAID' || bill.status === 'CANCELLED' || bill.status === 'REFUNDED') && (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>{formatFCFA(bill.insuranceShare)}</td>

                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    <span className={`badge ${config.cssClass}`}>{config.label}</span>
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    {/* UNPAID → Encaisser le total */}
                    {bill.status === 'UNPAID' && (
                      <button
                        onClick={() => onSelectBill(bill)}
                        className="btn btn-success"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Encaisser
                      </button>
                    )}

                    {/* PARTIALLY_PAID → Encaisser le solde restant */}
                    {bill.status === 'PARTIALLY_PAID' && (
                      <button
                        onClick={() => onSelectBill(bill)}
                        className="btn btn-warning"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        title={`Solde restant : ${formatFCFA(remainingBalance)}`}
                      >
                        Encaisser solde
                      </button>
                    )}

                    {/* PAID → Imprimer le reçu */}
                    {bill.status === 'PAID' && (
                      <button
                        onClick={() => onPrintInvoice(bill)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Reçu / Ticket
                      </button>
                    )}

                    {/* CANCELLED / REFUNDED → Voir le détail, aucune action de paiement */}
                    {(bill.status === 'CANCELLED' || bill.status === 'REFUNDED') && (
                      <button
                        onClick={() => onPrintInvoice(bill)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', opacity: 0.7 }}
                        title={
                          bill.status === 'CANCELLED'
                            ? 'Facture annulée — aucun paiement possible'
                            : 'Facture remboursée — aucun paiement possible'
                        }
                      >
                        Voir détail
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scope-contained style injection */}
      <style jsx>{`
        .table-th {
          padding: 0.85rem 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        /* ─── Badges ─────────────────────────────────── */
        .badge-paid {
          background-color: rgba(0, 200, 120, 0.15);
          color: #00c878;
          border: 1px solid rgba(0, 200, 120, 0.35);
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-unpaid {
          background-color: rgba(255, 80, 80, 0.15);
          color: #ff5050;
          border: 1px solid rgba(255, 80, 80, 0.35);
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-partial {
          background-color: rgba(255, 160, 0, 0.15);
          color: #ffa000;
          border: 1px solid rgba(255, 160, 0, 0.4);
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-cancelled {
          background-color: rgba(120, 120, 140, 0.15);
          color: #9090a0;
          border: 1px solid rgba(120, 120, 140, 0.35);
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-refunded {
          background-color: rgba(160, 90, 255, 0.15);
          color: #a05aff;
          border: 1px solid rgba(160, 90, 255, 0.35);
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .btn-warning {
          background-color: rgba(255, 160, 0, 0.2);
          color: #ffa000;
          border: 1px solid rgba(255, 160, 0, 0.5);
        }
        .btn-warning:hover {
          background-color: rgba(255, 160, 0, 0.35);
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .btn-ghost:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
};
