'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { Logo } from '../../components/Logo';
import { generateReportPDF } from '../../utils/pdfGenerator';

interface FinancialItem {
  method: string;
  amount: number;
  color: string;
}

interface PathologyStat {
  name: string;
  count: number;
  percentage: number;
}

interface PractitionerStat {
  id: string;
  name: string;
  email: string;
  phone: string;
  completedCount: number;
  totalRevenue: number;
}

interface ReportsData {
  financialSummary: FinancialItem[];
  pathologyStats: PathologyStat[];
  practitionerStats: PractitionerStat[];
}

export default function ReportsPage() {
  const { user, apiFetch, token } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting & Filtering States
  const [pathologyFilter, setPathologyFilter] = useState('');
  const [sortField, setSortField] = useState<'completedCount' | 'totalRevenue'>('completedCount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/reports/advanced');
      setData(res);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger les rapports avancés. Assurez-vous d\'avoir les droits d\'administrateur ou d\'être connecté.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchReportsData();
    }
  }, [token, fetchReportsData]);

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Génération des rapports d'activité...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ color: 'var(--danger)' }}>Accès Interdit</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={fetchReportsData} className="btn btn-primary">Réessayer</button>
      </div>
    );
  }

  const { financialSummary, pathologyStats, practitionerStats } = data;
  const totalRevenueSum = financialSummary.reduce((sum, item) => sum + item.amount, 0);

  const toggleSort = (field: 'completedCount' | 'totalRevenue') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredPathologies = pathologyStats.filter((p) =>
    p.name.toLowerCase().includes(pathologyFilter.toLowerCase())
  );

  const sortedPractitioners = [...practitionerStats].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Printable CSS style tag */}
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          header, .navbar, .btn, .no-print {
            display: none !important;
          }
          .glass-card {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            color: #000 !important;
            padding: 0 !important;
            margin-bottom: 2rem !important;
            page-break-inside: avoid;
          }
          h1, h2, h3, h4 {
            color: #000 !important;
          }
          table {
            border: 1px solid #000 !important;
          }
          th, td {
            border-bottom: 1px solid #000 !important;
            color: #000 !important;
          }
        }
      `}</style>

      <div style={styles.headerRow} className="no-print">
        <div>
          <h1>Rapports d'Activité &amp; Bilan Clinique</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Rapports d'activité médicale, bilan financier journalier détaillé et statistiques de performance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => generateReportPDF(data, totalRevenueSum, formatFCFA)}
            className="btn btn-primary"
          >
            📥 Télécharger PDF
          </button>
          <button onClick={handlePrint} className="btn btn-secondary">
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Printable Document Header (visible only when printing) */}
      <div style={styles.printHeader} className="print-only">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', justifyContent: 'flex-start' }}>
          <Logo size={42} mode="print" />
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#000' }}>MedClinik</h3>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>RAPPORTS D'ACTIVITÉ & ANALYSES HÔPITAL</p>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#333', marginTop: '0.5rem', textAlign: 'left' }}>
          Document de Bilan Journalier · Généré le : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </p>
        <div style={{ borderBottom: '2px solid #000', margin: '1rem 0' }}></div>
      </div>

      {/* Grid containing Financial Summary & Pathology stats */}
      <div className="grid-2">
        {/* Bilan financier */}
        <div className="glass-card">
          <h3>Bilan Financier Journalier</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Volume des encaissements par mode de règlement aujourd'hui.
          </p>

          <div style={styles.financialList}>
            {financialSummary.map((item) => (
              <div key={item.method} style={styles.financialItem}>
                <div style={styles.itemLeft}>
                  <span style={{ ...styles.colorDot, backgroundColor: item.color }}></span>
                  <span>{item.method}</span>
                </div>
                <strong>{formatFCFA(item.amount)}</strong>
              </div>
            ))}

            <div style={styles.totalRevenueRow}>
              <span>Volume Global Encaissements :</span>
              <strong>{formatFCFA(totalRevenueSum)}</strong>
            </div>
          </div>
        </div>

        {/* Pathologies les plus fréquentes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Rapport d'Activité Médicale</h3>
            <input
              type="text"
              placeholder="Filtrer..."
              value={pathologyFilter}
              onChange={(e) => setPathologyFilter(e.target.value)}
              className="form-input no-print"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '150px' }}
            />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Pathologies les plus fréquentes traitées par spécialité.
          </p>

          {filteredPathologies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Aucun diagnostic correspondant.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Diagnostic</th>
                    <th style={styles.th}>Consultations</th>
                    <th style={styles.th}>Proportion (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPathologies.map((patho) => (
                    <tr key={patho.name} style={styles.trRow}>
                      <td style={styles.td}><strong>{patho.name}</strong></td>
                      <td style={styles.td}>{patho.count}</td>
                      <td style={styles.td}>
                        <div style={styles.progressCell}>
                          <span>{patho.percentage}%</span>
                          <div style={styles.miniProgressBg}>
                            <div style={{ ...styles.miniProgressFill, width: `${patho.percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Practitioner performance statistics */}
      <div className="glass-card">
        <h3>Activité et Performance des Praticiens</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Statistiques de consultations réalisées et revenus générés par médecin.
        </p>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Praticien</th>
                <th style={styles.th}>Spécialité/Email</th>
                <th 
                  onClick={() => toggleSort('completedCount')}
                  style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                  title="Trier par nombre de consultations"
                >
                  Consultations {sortField === 'completedCount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th 
                  onClick={() => toggleSort('totalRevenue')}
                  style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                  title="Trier par chiffres d'affaires"
                >
                  Revenus Générés (FCFA) {sortField === 'totalRevenue' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPractitioners.map((doc) => (
                <tr key={doc.id} style={styles.trRow}>
                  <td style={styles.td}>
                    <strong>{doc.name}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '0.9rem' }}>{doc.email}</span> <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.phone}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{doc.completedCount}</td>
                  <td style={{ ...styles.td, color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    {formatFCFA(doc.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  printHeader: {
    display: 'none', // Only visible in print
  },
  spinnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  financialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.25rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  totalRevenueRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    borderTop: '2px solid var(--border-color)',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid var(--border-color)',
  },
  th: {
    padding: '0.85rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.95rem',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  miniProgressBg: {
    width: '100px',
    height: '6px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: 'var(--primary-color)',
  },
};
