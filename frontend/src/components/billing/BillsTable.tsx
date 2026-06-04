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
              <th className="table-th">Part Assureur</th>
              <th className="table-th">Statut</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                  <strong>{bill.patient.firstName} {bill.patient.lastName}</strong> <br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bill.patient.code}</span>
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
                          {validatingId === bill.id ? 'Connexion API...' : 'Valider via API'}
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
                <td style={{ padding: '1rem', fontSize: '0.95rem' }}>{formatFCFA(bill.insuranceShare)}</td>
                <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                  <span className={`badge ${bill.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}`}>
                    {bill.status === 'PAID' ? 'Réglé' : 'Impayé'}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                  {bill.status === 'UNPAID' ? (
                    <button
                      onClick={() => onSelectBill(bill)}
                      className="btn btn-success"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      Encaisser
                    </button>
                  ) : (
                    <button
                      onClick={() => onPrintInvoice(bill)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      Reçu / Ticket
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Scope-contained style injection to handle local th header styling without style objects */}
      <style jsx>{`
        .table-th {
          padding: 0.85rem 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};
