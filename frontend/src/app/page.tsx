'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, ROLE_LABELS } from '../components/AuthContext';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    consultationsCount: number;
    totalRevenue: number;
    patientShareSum: number;
    insuranceShareSum: number;
    bedOccupancy: number;
    criticalStockCount: number;
  };
  pathologies: Array<{ name: string; value: number }>;
  doctorStats: Array<{ name: string; count: number }>;
}

export default function Dashboard() {
  const { user, apiFetch, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive States
  const [hoveredPatho, setHoveredPatho] = useState<{ name: string; value: number; pct: number } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/reports/dashboard');
      setData(res);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger les données du tableau de bord. Vérifiez vos permissions ou la connexion.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement des données cliniques...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={styles.errorCard}>
        <h3 style={{ color: 'var(--danger)' }}>Erreur d'accès</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error || 'Données indisponibles.'}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">Réessayer</button>
      </div>
    );
  }

  const { metrics, pathologies, doctorStats } = data;

  // Format currency
  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
  };

  // Compute SVG percentages for circular progress (Pathologies)
  const totalPathologies = pathologies.reduce((acc, curr) => acc + curr.value, 0);

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Inconnu';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome & Role context */}
      <div style={styles.welcomeBanner} className="glass-card">
        <div>
          <h2>Bonjour, {user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Session active en tant que <strong>{roleLabel}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

          <div style={styles.dateBadge}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4 animate-slide-up">
        {/* Revenue */}
        <div className="glass-card" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>RECETTES CAISSE</span>
          </div>
          <div style={styles.kpiValue}>{formatFCFA(metrics.totalRevenue)}</div>
          <div style={styles.kpiFooter}>
            <span style={{ color: 'var(--success)' }}>●</span> Patient: {formatFCFA(metrics.patientShareSum)}{' '}
            <span style={{ color: 'var(--secondary-color)' }}>●</span> Mutuelle: {formatFCFA(metrics.insuranceShareSum)}
          </div>
        </div>

        {/* Consultations */}
        <div className="glass-card" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>CONSULTATIONS (JOUR)</span>
          </div>
          <div style={styles.kpiValue}>{metrics.consultationsCount}</div>
          <div style={styles.kpiFooter}>
            <Link href="/queue" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              Voir la file d'attente →
            </Link>
          </div>
        </div>

        {/* Bed occupancy */}
        <div className="glass-card" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>OCCUPATION LITS</span>
          </div>
          <div style={styles.kpiValue}>{metrics.bedOccupancy}%</div>
          <div style={styles.kpiFooter}>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${metrics.bedOccupancy}%`, background: 'var(--secondary-color)' }}></div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>32 sur 50 lits occupés</span>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="glass-card" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>CONSOMMABLES CRITIQUES</span>
          </div>
          <div style={{ ...styles.kpiValue, color: metrics.criticalStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {metrics.criticalStockCount}
          </div>
          <div style={styles.kpiFooter}>
            {metrics.criticalStockCount > 0 ? (
              <Link href="/stock" style={{ color: 'var(--danger)', textDecoration: 'none', fontWeight: '600' }}>
                Alerte : Restock requis →
              </Link>
            ) : (
              <span style={{ color: 'var(--success)' }}>Tous les stocks sont OK</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid-2">
        {/* Pathologies Breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3>Pathologies Traitées</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Répartition des diagnostics posés aujourd'hui.</p>
          </div>

          <div style={styles.chartFlex}>
            {/* SVG Pie Chart representation */}
            <div style={styles.svgWrapper}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                {totalPathologies > 0 ? (
                  pathologies.map((patho, idx) => {
                    const previousSum = pathologies.slice(0, idx).reduce((sum, p) => sum + p.value, 0);
                    const percent = patho.value / totalPathologies;
                    const strokeDasharray = `${percent * 440} 440`;
                    const strokeDashoffset = `${- (previousSum / totalPathologies) * 440}`;
                    const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--warning)', 'var(--danger)'];
                    const sliceColor = colors[idx % colors.length];
                    const isHovered = hoveredPatho?.name === patho.name;

                    return (
                      <circle
                        key={patho.name}
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={sliceColor}
                        strokeWidth={isHovered ? 20 : 14}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 80 80)"
                        onMouseEnter={() => setHoveredPatho({ name: patho.name, value: patho.value, pct: Math.round(percent * 100) })}
                        onMouseLeave={() => setHoveredPatho(null)}
                        style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' }}
                      />
                    );
                  })
                ) : (
                  <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                )}
                
                <text x="80" y={hoveredPatho ? 74 : 86} textAnchor="middle" fill="#fff" fontSize={hoveredPatho ? "1.2rem" : "1.6rem"} fontWeight="bold">
                  {hoveredPatho ? hoveredPatho.value : totalPathologies}
                </text>
                
                {hoveredPatho ? (
                  <>
                    <text x="80" y="94" textAnchor="middle" fill="var(--text-muted)" fontSize="0.75rem" fontWeight="600">
                      {hoveredPatho.name.length > 13 ? hoveredPatho.name.substring(0, 11) + '...' : hoveredPatho.name}
                    </text>
                    <text x="80" y="112" textAnchor="middle" fill="var(--primary-color)" fontSize="0.85rem" fontWeight="bold">
                      {hoveredPatho.pct}%
                    </text>
                  </>
                ) : (
                  <text x="80" y="104" textAnchor="middle" fill="var(--text-muted)" fontSize="0.75rem">
                    Total
                  </text>
                )}
              </svg>
            </div>

            {/* Legends */}
            <div style={styles.legendsList}>
              {pathologies.map((patho, idx) => {
                const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--warning)', 'var(--danger)'];
                const sliceColor = colors[idx % colors.length];
                const pct = totalPathologies > 0 ? Math.round((patho.value / totalPathologies) * 100) : 0;
                return (
                  <div key={patho.name} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: sliceColor }}></span>
                    <span style={styles.legendText}>
                      <strong>{patho.name}</strong> : {patho.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Practitioner / Doctor Activity */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3>Activité des Praticiens</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Nombre de consultations terminées par médecin.</p>
          </div>

          <div style={styles.barChartContainer}>
            {doctorStats.map((doc) => {
              const maxCount = Math.max(...doctorStats.map((d) => d.count), 1);
              const barPercent = Math.round((doc.count / maxCount) * 100);
              return (
                <div key={doc.name} style={styles.barItem}>
                  <div style={styles.barLabel}>{doc.name}</div>
                  <div style={styles.barVisualFlex}>
                    <div style={styles.progressBarBg}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${barPercent}%`,
                          background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                        }}
                      ></div>
                    </div>
                    <div style={styles.barValueCount}>{doc.count} consult.</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid var(--border-color)',
    borderTop: '4px solid var(--primary-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorCard: {
    textAlign: 'center',
    padding: '3rem',
    maxWidth: '500px',
    margin: '2rem auto',
  },
  welcomeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderLeft: '4px solid var(--primary-color)',
  },
  dateBadge: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--primary-color)',
    background: 'var(--primary-glow)',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    textTransform: 'capitalize',
  },
  kpiCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '160px',
    position: 'relative',
    overflow: 'hidden',
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  kpiLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: '0.75rem 0',
    fontFamily: 'var(--font-title)',
  },
  kpiFooter: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.5rem',
    lineHeight: '1.6',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  chartFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '1rem',
  },
  svgWrapper: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  legendsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  barChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '1rem',
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  barLabel: {
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  barVisualFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  barValueCount: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    flexShrink: 0,
  },
  simControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
  },
  toggleSwitch: {
    cursor: 'pointer',
    accentColor: 'var(--primary-color)',
    width: '16px',
    height: '16px',
  },
};
