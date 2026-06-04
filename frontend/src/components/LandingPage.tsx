'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoginView } from './LoginView';

export const LandingPage: React.FC = () => {
  const { triggerRoleSwitch } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.landingWrapper}>
      {/* ─── HEADER / NAVBAR ─────────────────────────────────────────────────── */}
      <header className="navbar" style={styles.headerOverride}>
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Med<span>Clinik</span>
        </div>
        
        <nav style={styles.navLinks}>
          <button onClick={() => scrollToSection('features')} style={styles.navLinkBtn}>Fonctionnalités</button>
          <button onClick={() => scrollToSection('roles')} style={styles.navLinkBtn}>Portails Métiers</button>
          <button onClick={() => scrollToSection('wave-integration')} style={styles.navLinkBtn}>Intégration Wave</button>
        </nav>

        <div style={styles.navActions}>
          <button 
            className="btn btn-primary" 
            style={styles.ctaHeader}
            onClick={() => setShowLogin(true)}
          >
            Accéder au Portail
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          {/* Hero Left Content */}
          <div style={styles.heroContent} className="animate-slide-up">
            <div style={styles.badgeWrapper}>
              <span className="badge badge-paid" style={styles.heroBadge}>
                ✨ Nouveau : Wave Pay &amp; SMS OTP 2FA Intégrés
              </span>
            </div>
            
            <h1 style={styles.heroTitle}>
              La gestion médicale<br />
              <span style={styles.titleGradient}>réinventée pour l'Afrique</span>
            </h1>
            
            <p style={styles.heroSubtitle}>
              MedClinik est un ERP médical complet et de nouvelle génération conçu pour éradiquer les fuites financières, centraliser le dossier médical partagé (DMP) en temps réel et sécuriser les ordonnances.
            </p>
            
            <div style={styles.heroActions}>
              <button 
                className="btn btn-primary" 
                style={styles.heroBtnPrimary}
                onClick={() => setShowLogin(true)}
              >
                Se Connecter à la Clinique
              </button>
              <button 
                className="btn btn-secondary" 
                style={styles.heroBtnSecondary}
                onClick={() => scrollToSection('features')}
              >
                Découvrir les Fonctionnalités
              </button>
            </div>
          </div>

          {/* Hero Right Visual: Live CSS Mockup of Dashboard */}
          <div style={styles.heroVisual} className="animate-float">
            <div className="glass-card" style={styles.mockupBrowser}>
              {/* macOS Dots */}
              <div style={styles.mockupHeader}>
                <div style={styles.mockupDots}>
                  <span style={{ ...styles.dot, backgroundColor: 'var(--danger)' }}></span>
                  <span style={{ ...styles.dot, backgroundColor: 'var(--warning)' }}></span>
                  <span style={{ ...styles.dot, backgroundColor: 'var(--success)' }}></span>
                </div>
                <div style={styles.mockupTitleBar}>medclinik.cloud/dashboard</div>
              </div>

              {/* Mockup Inside */}
              <div style={styles.mockupContent}>
                {/* Visual Banner */}
                <div style={styles.mockupWelcome}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#fff' }}>Clinique Pasteur</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>● Mode Démo en Ligne</span>
                  </div>
                  <div style={styles.mockupWelcomeBadge}>Activité du Jour</div>
                </div>

                {/* Grid of Mini KPIs */}
                <div style={styles.mockupKpiGrid}>
                  <div style={styles.mockupKpiCard}>
                    <span style={styles.mockupKpiLabel}>Recettes Caisse</span>
                    <strong style={styles.mockupKpiVal}>14 850 000 FCFA</strong>
                    <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>↑ 14% vs hier</span>
                  </div>
                  <div style={styles.mockupKpiCard}>
                    <span style={styles.mockupKpiLabel}>Consultations</span>
                    <strong style={styles.mockupKpiVal}>42 Patients</strong>
                    <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>6 en attente</span>
                  </div>
                  <div style={styles.mockupKpiCard}>
                    <span style={styles.mockupKpiLabel}>Lits Occupés</span>
                    <strong style={styles.mockupKpiVal}>32 / 50 (64%)</strong>
                    <div style={styles.mockupProgressBg}>
                      <div style={{ ...styles.mockupProgressFill, width: '64%' }}></div>
                    </div>
                  </div>
                </div>

                {/* SVG Graph Visual */}
                <div style={styles.mockupChartCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Courbe de Fréquentation Horaire</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Pic : 11h</span>
                  </div>
                  <svg viewBox="0 0 300 80" style={{ width: '100%', height: '60px' }}>
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.05)" />
                    {/* Area */}
                    <path d="M 0 70 L 30 50 L 60 55 L 90 30 L 120 15 L 150 40 L 180 20 L 210 25 L 240 60 L 270 45 L 300 70 Z" fill="url(#grad)" />
                    {/* Line */}
                    <path d="M 0 70 L 30 50 L 60 55 L 90 30 L 120 15 L 150 40 L 180 20 L 210 25 L 240 60 L 270 45 L 300 70" fill="none" stroke="var(--primary-color)" strokeWidth="2" />
                    {/* Glowing dots */}
                    <circle cx="120" cy="15" r="4" fill="var(--primary-color)" />
                    <circle cx="180" cy="20" r="3" fill="var(--secondary-color)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION (GRID 3x2) ────────────────────────────────────── */}
      <section id="features" style={styles.sectionPadding}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPretitle}>Innovations &amp; Sécurité</span>
          <h2 style={styles.sectionTitle}>Une suite complète pour votre clinique</h2>
          <p style={styles.sectionDescription}>
            Chaque module a été pensé pour rationaliser les soins et sécuriser les processus financiers.
          </p>
        </div>

        <div className="grid-3" style={styles.gridContainer}>
          {/* Card 1: Fuites Financières */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-color)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Éradication des Fuites</h3>
            <p style={styles.featureText}>
              Verrous algorithmiques interdisant le double encaissement, rapprochement automatique de caisse, et validation stricte des parts d'assurance.
            </p>
          </div>

          {/* Card 2: DMP */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--secondary-color)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Dossier Médical Partagé</h3>
            <p style={styles.featureText}>
              Fiche clinique universelle contenant les antécédents, allergies, constantes vitales et historiques de consultations accessibles en un clic par les praticiens.
            </p>
          </div>

          {/* Card 3: Wave integration */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-color)' }}>
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Intégration Wave Pay</h3>
            <p style={styles.featureText}>
              Générez instantanément des QR codes Wave pour le paiement au guichet ou envoyez des SMS de facturation avec lien de paiement sécurisé.
            </p>
          </div>

          {/* Card 4: Inventory / Stocks */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--warning)' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Pharmacie &amp; Consommables</h3>
            <p style={styles.featureText}>
              Gestion des stocks avec alertes automatiques en cas de seuil critique ou de péremption imminente pour éviter toute rupture.
            </p>
          </div>

          {/* Card 5: Queue management */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-color)' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>File d'Attente Digitale</h3>
            <p style={styles.featureText}>
              Acheminement et affichage dynamique des patients selon l'ordre d'arrivée, les priorités d'urgences, et les affectations aux praticiens.
            </p>
          </div>

          {/* Card 6: 2FA security */}
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--success)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Sécurité 2FA &amp; SMS OTP</h3>
            <p style={styles.featureText}>
              Protection renforcée de l'accès clinique avec authentification à double facteur obligatoire via code envoyé par SMS (propulsé par Redis).
            </p>
          </div>
        </div>
      </section>

      {/* ─── WAVE PAY & WEBHOOKS FOCUS ───────────────────────────────────────── */}
      <section id="wave-integration" style={styles.waveSection}>
        <div style={styles.waveContainer}>
          <div style={styles.waveContent}>
            <span style={styles.waveBadge}>MODULE PARTENAIRE</span>
            <h2 style={styles.waveTitle}>Encaissements instantanés avec Wave Mobile Money</h2>
            <p style={styles.waveText}>
              L'intégration complète de l'API Wave permet d'accélérer les flux en caisse. Générez un QR Code unique sur l'écran du caissier ou envoyez directement une demande de paiement par SMS au téléphone du patient. Le système écoute en continu les Webhooks de Wave pour valider automatiquement la facture et imprimer le ticket dès réception des fonds.
            </p>
            <div style={styles.waveFeatureList}>
              <div style={styles.waveFeatureItem}>
                <span style={styles.waveFeatureIcon}>✓</span>
                <span>Détection de double paiement au centime près</span>
              </div>
              <div style={styles.waveFeatureItem}>
                <span style={styles.waveFeatureIcon}>✓</span>
                <span>Rapprochement instantané en base de données clinique</span>
              </div>
              <div style={styles.waveFeatureItem}>
                <span style={styles.waveFeatureIcon}>✓</span>
                <span>Fallback automatique par polling sécurisé</span>
              </div>
            </div>
          </div>
          <div style={styles.waveVisualCard}>
            <div className="glass-card" style={styles.wavePhoneMock}>
              <div style={styles.phoneNotch}></div>
              <div style={styles.phoneScreen}>
                <div style={styles.waveBrand}>wave</div>
                <div style={styles.waveReceipt}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Paiement Médical</span>
                  <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0.25rem 0 1rem 0' }}>15 000 FCFA</h3>
                  <div style={styles.waveInfoRow}>
                    <span>Clinique :</span>
                    <strong>Pasteur Dakar</strong>
                  </div>
                  <div style={styles.waveInfoRow}>
                    <span>Facture # :</span>
                    <strong>FAC-2026-89</strong>
                  </div>
                  <div style={styles.waveQrPlaceholder}>
                    {/* Custom Mock QR Code */}
                    <div style={styles.qrInner}>
                      <div style={{ ...styles.qrBlock, top: 4, left: 4 }}></div>
                      <div style={{ ...styles.qrBlock, top: 4, right: 4 }}></div>
                      <div style={{ ...styles.qrBlock, bottom: 4, left: 4 }}></div>
                      <div style={{ ...styles.qrBlock, top: 20, left: 20, width: 28, height: 28, backgroundColor: 'var(--primary-color)' }}></div>
                    </div>
                  </div>
                  <div style={styles.waveStatusText}>Scannez pour valider le paiement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROLE SWITCHER DEMO SECTION ──────────────────────────────────────── */}
      <section id="roles" style={styles.sectionPadding}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPretitle}>Essayez l'ERP Maintenant</span>
          <h2 style={styles.sectionTitle}>Portails d'accès par rôle métier</h2>
          <p style={styles.sectionDescription}>
            Découvrez comment l'application s'adapte dynamiquement selon votre profil professionnel. Cliquez sur un rôle pour vous connecter instantanément à l'espace correspondant.
          </p>
        </div>

        <div style={styles.rolesGrid}>
          {/* Card Admin */}
          <div className="glass-card" style={styles.roleCard} onClick={() => triggerRoleSwitch('ADMIN')}>
            <div style={styles.roleIconBg}>🛠️</div>
            <h3 style={styles.roleTitle}>Administrateur</h3>
            <p style={styles.roleDesc}>
              Pilotez l'établissement : statistiques de recettes, logs d'audits financiers de la caisse, gestion des stocks et paramétrage du personnel.
            </p>
            <span style={styles.roleActionText}>Tester le portail Admin →</span>
          </div>

          {/* Card Doctor */}
          <div className="glass-card" style={styles.roleCard} onClick={() => triggerRoleSwitch('DOCTOR')}>
            <div style={styles.roleIconBg}>🩺</div>
            <h3 style={styles.roleTitle}>Médecin</h3>
            <p style={styles.roleDesc}>
              Accédez au DMP des patients, enregistrez les diagnostics de consultations, prescrivez des ordonnances sécurisées et suivez votre file d'attente.
            </p>
            <span style={styles.roleActionText}>Tester le portail Médecin →</span>
          </div>

          {/* Card Nurse */}
          <div className="glass-card" style={styles.roleCard} onClick={() => triggerRoleSwitch('NURSE')}>
            <div style={styles.roleIconBg}>💉</div>
            <h3 style={styles.roleTitle}>Infirmier</h3>
            <p style={styles.roleDesc}>
              Saisissez les constantes vitales des patients à leur arrivée (pression, pouls, température), gérez l'ordre de passage et assurez le premier accueil.
            </p>
            <span style={styles.roleActionText}>Tester le portail Infirmier →</span>
          </div>

          {/* Card Cashier */}
          <div className="glass-card" style={styles.roleCard} onClick={() => triggerRoleSwitch('CASHIER')}>
            <div style={styles.roleIconBg}>💵</div>
            <h3 style={styles.roleTitle}>Caissier</h3>
            <p style={styles.roleDesc}>
              Émettez les factures d'actes, appliquez la couverture mutuelle tiers-payant, encaissez par Cash/Wave et imprimez les reçus officiels de caisse.
            </p>
            <span style={styles.roleActionText}>Tester le portail Caissier →</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerBrandCol}>
            <h3 style={{ fontFamily: 'var(--font-title)', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
              Med<span style={{ color: 'var(--primary-color)' }}>Clinik</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              Système intégré de gestion clinique et de caisse souveraine. Conçu pour le continent africain.
            </p>
          </div>
          <div style={styles.footerLinksGrid}>
            <div>
              <h5 style={styles.footerColTitle}>Produit</h5>
              <ul style={styles.footerLinksList}>
                <li><a href="#features" style={styles.footerLink}>Fonctionnalités</a></li>
                <li><a href="#roles" style={styles.footerLink}>Espace Démo</a></li>
                <li><a href="#wave-integration" style={styles.footerLink}>Wave Pay</a></li>
              </ul>
            </div>
            <div>
              <h5 style={styles.footerColTitle}>Sécurité</h5>
              <ul style={styles.footerLinksList}>
                <li><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Double Facteur SMS</span></li>
                <li><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Dossier Chiffré</span></li>
                <li><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rapports d'Audit logs</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} MedClinik ERP. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ─── LOGIN PORTAL OVERLAY ────────────────────────────────────────────── */}
      {showLogin && (
        <div style={styles.loginOverlay} className="animate-fade-in">
          <LoginView onClose={() => setShowLogin(false)} />
        </div>
      )}
    </div>
  );
};

// ─── STYLES (VANILLA CSS IN JS FOR NEXT.JS EXPORT COMPATIBILITY) ───────────────
const styles: Record<string, React.CSSProperties> = {
  landingWrapper: {
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-body)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  headerOverride: {
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: 'rgba(10, 15, 26, 0.85)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'color 0.2s ease',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
  },
  ctaHeader: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.85rem',
  },
  heroSection: {
    position: 'relative',
    padding: '6rem 2rem 4rem 2rem',
    overflow: 'hidden',
  },
  heroContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  badgeWrapper: {
    display: 'inline-block',
  },
  heroBadge: {
    fontSize: '0.8rem',
    textTransform: 'none',
    fontWeight: 600,
    letterSpacing: '0px',
    padding: '0.35rem 1rem',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: 800,
    lineHeight: '1.15',
    fontFamily: 'var(--font-title)',
    color: '#fff',
  },
  titleGradient: {
    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 800,
  },
  heroSubtitle: {
    fontSize: '1.1rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    maxWidth: '540px',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  heroBtnPrimary: {
    padding: '0.85rem 1.75rem',
    fontSize: '1rem',
  },
  heroBtnSecondary: {
    padding: '0.85rem 1.75rem',
    fontSize: '1rem',
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupBrowser: {
    width: '100%',
    maxWidth: '480px',
    padding: 0,
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: 'var(--shadow-lg), var(--neon-glow)',
  },
  mockupHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    gap: '1rem',
  },
  mockupDots: {
    display: 'flex',
    gap: '0.4rem',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  mockupTitleBar: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    background: 'rgba(0,0,0,0.2)',
    padding: '0.2rem 1.5rem',
    borderRadius: '4px',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  mockupContent: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    backgroundColor: 'rgba(10, 15, 26, 0.4)',
  },
  mockupWelcome: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '0.75rem',
  },
  mockupWelcomeBadge: {
    background: 'var(--primary-glow)',
    color: 'var(--primary-color)',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
  },
  mockupKpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
  },
  mockupKpiCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  mockupKpiLabel: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  mockupKpiVal: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: '#fff',
  },
  mockupProgressBg: {
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '0.25rem',
  },
  mockupProgressFill: {
    height: '100%',
    backgroundColor: 'var(--secondary-color)',
    borderRadius: '10px',
  },
  mockupChartCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '0.75rem',
  },
  sectionPadding: {
    padding: '6rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sectionPretitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    fontFamily: 'var(--font-title)',
    color: '#fff',
  },
  sectionDescription: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    maxWidth: '600px',
    lineHeight: '1.6',
  },
  gridContainer: {
    width: '100%',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'flex-start',
    padding: '2rem',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'var(--font-title)',
  },
  featureText: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    margin: 0,
  },
  waveSection: {
    background: 'radial-gradient(circle at 10% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 60%)',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
    padding: '6rem 2rem',
    width: '100%',
  },
  waveContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  waveContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    alignItems: 'flex-start',
  },
  waveBadge: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'var(--secondary-color)',
    letterSpacing: '0.05em',
  },
  waveTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    fontFamily: 'var(--font-title)',
    color: '#fff',
    lineHeight: '1.2',
  },
  waveText: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
  },
  waveFeatureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  waveFeatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.95rem',
  },
  waveFeatureIcon: {
    color: 'var(--primary-color)',
    fontWeight: 'bold',
  },
  waveVisualCard: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavePhoneMock: {
    width: '260px',
    height: '480px',
    borderRadius: '36px',
    border: '6px solid #2d3748',
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg), 0 0 30px rgba(6, 182, 212, 0.1)',
  },
  phoneNotch: {
    width: '120px',
    height: '18px',
    backgroundColor: '#2d3748',
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    zIndex: 2,
  },
  phoneScreen: {
    padding: '2rem 1rem 1rem 1rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  waveBrand: {
    fontSize: '1.2rem',
    fontWeight: 900,
    color: 'var(--primary-color)',
    textAlign: 'center',
    fontFamily: 'var(--font-title)',
    letterSpacing: '-0.5px',
  },
  waveReceipt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '1.25rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  waveInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '0.75rem',
    borderBottom: '1px dotted rgba(255,255,255,0.1)',
    paddingBottom: '0.4rem',
    marginBottom: '0.4rem',
  },
  waveQrPlaceholder: {
    width: '120px',
    height: '120px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    margin: '1rem 0',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInner: {
    width: '100%',
    height: '100%',
    border: '2px solid #000',
    position: 'relative',
  },
  qrBlock: {
    position: 'absolute',
    width: '16px',
    height: '16px',
    backgroundColor: '#000',
  },
  waveStatusText: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: 'auto',
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    width: '100%',
  },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    padding: '1.75rem',
    cursor: 'pointer',
    alignItems: 'flex-start',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  roleIconBg: {
    fontSize: '2rem',
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'var(--font-title)',
  },
  roleDesc: {
    fontSize: '0.85rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    margin: 0,
    flex: 1,
  },
  roleActionText: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginTop: '0.5rem',
  },
  footer: {
    backgroundColor: 'rgba(5, 8, 16, 0.95)',
    borderTop: '1px solid var(--border-color)',
    padding: '4rem 2rem 2rem 2rem',
    width: '100%',
    marginTop: 'auto',
  },
  footerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr',
    gap: '4rem',
    paddingBottom: '3rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  footerBrandCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerLinksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '2rem',
  },
  footerColTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '1rem',
    fontFamily: 'var(--font-title)',
  },
  footerLinksList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  footerLink: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.2s ease',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '2rem auto 0 auto',
    textAlign: 'center',
  },
  loginOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};
