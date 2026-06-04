'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, ROLE_LABELS } from '../components/AuthContext';
import Link from 'next/link';
import { LandingPage } from '../components/LandingPage';

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
  const { user, apiFetch, token, logout } = useAuth();

  // Si l'utilisateur n'est pas connecté, afficher la Landing Page publique
  if (!user) {
    return <LandingPage />;
  }

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
      <div className="dashboard-loading-container">
        <div className="dashboard-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement des données cliniques...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-error-card glass-card">
        <h3 style={{ color: 'var(--danger)' }}>Erreur d'accès</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error || 'Données indisponibles.'}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={fetchDashboardData} className="btn btn-primary">Réessayer</button>
          <button onClick={logout} className="btn btn-secondary">Déconnexion</button>
        </div>
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
      <div className="dashboard-welcome-banner glass-card">
        <div>
          <h2>Bonjour, {user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Session active en tant que <strong>{roleLabel}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="dashboard-date-badge">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4 animate-slide-up">
        {/* Revenue */}
        <div className="dashboard-kpi-card glass-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">RECETTES CAISSE</span>
          </div>
          <div className="dashboard-kpi-value">{formatFCFA(metrics.totalRevenue)}</div>
          <div className="dashboard-kpi-footer">
            <span style={{ color: 'var(--success)' }}>●</span> Patient: {formatFCFA(metrics.patientShareSum)}{' '}
            <span style={{ color: 'var(--secondary-color)' }}>●</span> Mutuelle: {formatFCFA(metrics.insuranceShareSum)}
          </div>
        </div>

        {/* Consultations */}
        <div className="dashboard-kpi-card glass-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">CONSULTATIONS (JOUR)</span>
          </div>
          <div className="dashboard-kpi-value">{metrics.consultationsCount}</div>
          <div className="dashboard-kpi-footer">
            <Link href="/queue" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              Voir la file d'attente →
            </Link>
          </div>
        </div>

        {/* Bed occupancy */}
        <div className="dashboard-kpi-card glass-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">OCCUPATION LITS</span>
          </div>
          <div className="dashboard-kpi-value">{metrics.bedOccupancy}%</div>
          <div className="dashboard-kpi-footer">
            <div className="dashboard-progress-bar-bg">
              <div className="dashboard-progress-bar-fill" style={{ width: `${metrics.bedOccupancy}%`, background: 'var(--secondary-color)' }}></div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>32 sur 50 lits occupés</span>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="dashboard-kpi-card glass-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">CONSOMMABLES CRITIQUES</span>
          </div>
          <div className="dashboard-kpi-value" style={{ color: metrics.criticalStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {metrics.criticalStockCount}
          </div>
          <div className="dashboard-kpi-footer">
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

          <div className="dashboard-chart-flex">
            {/* SVG Pie Chart representation */}
            <div className="dashboard-svg-wrapper">
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
            <div className="dashboard-legends-list">
              {pathologies.map((patho, idx) => {
                const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--warning)', 'var(--danger)'];
                const sliceColor = colors[idx % colors.length];
                const pct = totalPathologies > 0 ? Math.round((patho.value / totalPathologies) * 100) : 0;
                return (
                  <div key={patho.name} className="dashboard-legend-item">
                    <span className="dashboard-legend-dot" style={{ backgroundColor: sliceColor }}></span>
                    <span className="dashboard-legend-text">
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

          <div className="dashboard-bar-chart-container">
            {doctorStats.map((doc) => {
              const maxCount = Math.max(...doctorStats.map((d) => d.count), 1);
              const barPercent = Math.round((doc.count / maxCount) * 100);
              return (
                <div key={doc.name} className="dashboard-bar-item">
                  <div className="dashboard-bar-label">{doc.name}</div>
                  <div className="dashboard-bar-visual-flex">
                    <div className="dashboard-progress-bar-bg" style={{ margin: 0 }}>
                      <div
                        className="dashboard-progress-bar-fill"
                        style={{
                          width: `${barPercent}%`,
                          background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                        }}
                      ></div>
                    </div>
                    <div className="dashboard-bar-value-count">{doc.count} consult.</div>
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
