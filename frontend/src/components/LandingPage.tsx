'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { LoginView } from './LoginView';

// ─── SCROLL ANIMATION HOOK ────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ─── REVEAL WRAPPER ───────────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { triggerRoleSwitch } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <span style={s.navBrand} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Med<span style={s.navBrandAccent}>Clinik</span>
        </span>
        <nav style={s.navCenter}>
          {['features', 'roles', 'wave-integration'].map((id, i) => (
            <button key={id} style={s.navLink} onClick={() => scrollTo(id)}>
              {['Fonctionnalités', 'Portails', 'Wave Pay'][i]}
            </button>
          ))}
        </nav>
        <button style={s.navCta} onClick={() => setShowLogin(true)}>
          Accéder au Portail
        </button>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        {/* Gradient orbs */}
        <div style={s.orb1} />
        <div style={s.orb2} />

        <div style={s.heroInner}>
          <div style={s.heroEyebrow} className="anim-fade-up">
            <span style={s.heroPill}>Nouveau · ERP Médical Africain</span>
          </div>
          <h1 style={s.heroH1} className="anim-fade-up anim-delay-1">
            La gestion médicale<br />
            <span style={s.heroGrad}>réinventée pour<br />l'Afrique.</span>
          </h1>
          <p style={s.heroSub} className="anim-fade-up anim-delay-2">
            Centralisez le dossier médical partagé, éradique les fuites financières
            et sécurisez chaque transaction — en temps réel.
          </p>
          <div style={s.heroCtas} className="anim-fade-up anim-delay-3">
            <button style={s.btnPrimary} onClick={() => setShowLogin(true)}>
              Commencer maintenant
            </button>
            <button style={s.btnGhost} onClick={() => scrollTo('features')}>
              Découvrir ↓
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div style={s.heroDashWrap} className="anim-fade-up anim-delay-4">
          <div style={s.heroDash}>
            {/* Title bar */}
            <div style={s.dashBar}>
              <div style={s.dashDots}>
                {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                  <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />
                ))}
              </div>
              <div style={s.dashUrl}>medclinik.cloud/dashboard</div>
            </div>
            {/* Content */}
            <div style={s.dashBody}>
              <div style={s.dashHeader}>
                <div>
                  <div style={s.dashClinic}>Clinique Pasteur</div>
                  <div style={s.dashOnline}>● Mode démo en ligne</div>
                </div>
                <span style={s.dashBadge}>Activité du Jour</span>
              </div>
              <div style={s.dashKpis}>
                {[
                  { label: 'Recettes', value: '14 850 000', unit: 'FCFA', delta: '↑ 14%', color: '#34d399' },
                  { label: 'Consultations', value: '42', unit: 'Patients', delta: '6 en attente', color: '#60a5fa' },
                  { label: 'Lits Occupés', value: '32/50', unit: '64%', delta: '', color: '#a78bfa', bar: 64 },
                ].map(k => (
                  <div key={k.label} style={s.dashKpi}>
                    <div style={s.dashKpiLabel}>{k.label}</div>
                    <div style={s.dashKpiVal}>{k.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{k.unit}</div>
                    {k.delta ? <div style={{ fontSize: '0.65rem', color: k.color, marginTop: 2 }}>{k.delta}</div> : null}
                    {k.bar ? (
                      <div style={{ marginTop: 6, height: 3, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: `${k.bar}%`, height: '100%', borderRadius: 4, background: k.color }} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {/* Sparkline */}
              <div style={s.dashChart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fff' }}>Fréquentation Horaire</span>
                  <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Pic : 11h</span>
                </div>
                <svg viewBox="0 0 320 72" style={{ width: '100%', height: 60 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="24" x2="320" y2="24" stroke="rgba(255,255,255,0.04)" />
                  <line x1="0" y1="48" x2="320" y2="48" stroke="rgba(255,255,255,0.04)" />
                  <path d="M0 68 L32 50 L64 54 L96 32 L128 14 L160 38 L192 18 L224 24 L256 58 L288 44 L320 68Z" fill="url(#cg)" />
                  <path d="M0 68 L32 50 L64 54 L96 32 L128 14 L160 38 L192 18 L224 24 L256 58 L288 44 L320 68" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                  <circle cx="128" cy="14" r="3.5" fill="#60a5fa" />
                  <circle cx="192" cy="18" r="2.5" fill="#a78bfa" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HEADLINE NUMBERS ──────────────────────────────────────────────── */}
      <section style={s.stats}>
        <div style={s.statsInner}>
          {[
            { num: '99.9%', label: 'Disponibilité garantie' },
            { num: '0', label: 'Double encaissement détecté' },
            { num: '4', label: 'Rôles métier intégrés' },
            { num: '∞', label: 'Patients sans limite' },
          ].map((stat, i) => (
            <Reveal key={stat.num} delay={i * 80}>
              <div style={s.statCard}>
                <div style={s.statNum}>{stat.num}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" style={s.section}>
        <Reveal>
          <p style={s.sectionEye}>Sécurité &amp; Innovation</p>
          <h2 style={s.sectionH2}>Une suite complète<br />pour votre clinique.</h2>
        </Reveal>

        {/* Big Feature: DMP */}
        <Reveal delay={100}>
          <div style={s.featureBig}>
            <div style={s.featureBigText}>
              <div style={s.featureTag}>Dossier Médical Partagé</div>
              <h3 style={s.featureBigH3}>La fiche patient universelle, en temps réel.</h3>
              <p style={s.featureBigP}>
                Antécédents, allergies, constantes vitales, historique de consultations — tout accessible en un clic par l'ensemble des praticiens de l'établissement. Plus aucune information perdue entre deux services.
              </p>
            </div>
            <div style={s.featureBigViz}>
              <PatientCard />
            </div>
          </div>
        </Reveal>

        {/* Feature Grid */}
        <div style={s.featGrid}>
          {[
            {
              icon: (color: string) => (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
              ),
              title: 'Zéro Fuite Financière',
              text: 'Verrous algorithmiques contre le double encaissement, rapprochement automatique et validation stricte des parts d\'assurance.',
              color: '#34d399',
            },
            {
              icon: (color: string) => (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              ),
              title: 'Pharmacie & Stocks',
              text: 'Alertes automatiques sur les seuils critiques et péremptions imminentes pour ne jamais être en rupture.',
              color: '#f59e0b',
            },
            {
              icon: (color: string) => (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: 'File d\'Attente Digitale',
              text: 'Acheminement dynamique selon l\'ordre d\'arrivée, les urgences et les affectations praticiens.',
              color: '#60a5fa',
            },
            {
              icon: (color: string) => (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
              title: 'Authentification 2FA SMS',
              text: 'Protection renforcée avec double facteur obligatoire via code OTP envoyé par SMS, propulsé par Redis.',
              color: '#a78bfa',
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div style={s.featCard}>
                <div style={{ marginBottom: 16 }}>{f.icon(f.color)}</div>
                <h4 style={s.featCardH4}>{f.title}</h4>
                <p style={s.featCardP}>{f.text}</p>
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.8rem', color: f.color, fontWeight: 600 }}>En savoir plus →</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── WAVE PAY ──────────────────────────────────────────────────────── */}
      <section id="wave-integration" style={s.waveSec}>
        <div style={s.waveOrb} />
        <div style={s.waveInner}>
          <div style={s.waveText}>
            <Reveal>
              <span style={s.waveBadge}>Partenaire intégré</span>
              <h2 style={s.waveH2}>Encaissements instantanés<br />avec Wave Mobile Money.</h2>
              <p style={s.waveP}>
                Générez un QR Code unique sur l'écran du caissier ou envoyez une demande de paiement par SMS. Le système écoute en continu les Webhooks Wave pour valider la facture et imprimer le ticket dès réception des fonds.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div style={s.waveChecks}>
                {[
                  'Détection de double paiement au centime près',
                  'Rapprochement instantané en base de données',
                  'Fallback automatique par polling sécurisé',
                ].map(item => (
                  <div key={item} style={s.waveCheck}>
                    <span style={s.waveCheckIcon}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <div style={s.wavePhone}>
              <img 
                src="/wave_payment_screen.png" 
                alt="Wave Payment Checkout Senegal" 
                style={s.waveMockupImage} 
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────────────────── */}
      <section id="roles" style={s.section}>
        <Reveal>
          <p style={s.sectionEye}>Essayez Maintenant</p>
          <h2 style={s.sectionH2}>Chaque rôle,<br />son portail dédié.</h2>
          <p style={s.sectionSub}>Cliquez sur un rôle pour accéder instantanément à l'espace correspondant.</p>
        </Reveal>

        <div style={s.rolesGrid}>
          {[
            {
              role: 'ADMIN' as const,
              title: 'Administrateur',
              desc: 'Pilotez l\'établissement : statistiques, logs d\'audit financier, gestion des stocks et paramétrage du personnel.',
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              ),
              accent: '#60a5fa',
            },
            {
              role: 'DOCTOR' as const,
              title: 'Médecin',
              desc: 'Accédez au DMP, enregistrez les diagnostics, prescrivez des ordonnances sécurisées et gérez votre file d\'attente.',
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
              accent: '#34d399',
            },
            {
              role: 'NURSE' as const,
              title: 'Infirmier',
              desc: 'Saisissez les constantes vitales, gérez l\'ordre de passage et assurez le premier accueil des patients.',
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 14h6" />
                  <path d="M9 18h6" />
                  <path d="M9 10h6" />
                </svg>
              ),
              accent: '#a78bfa',
            },
            {
              role: 'CASHIER' as const,
              title: 'Caissier',
              desc: 'Émettez les factures, appliquez la couverture mutuelle, encaissez par Cash ou Wave et imprimez les reçus.',
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="7" y1="15" x2="7.01" y2="15" />
                  <line x1="11" y1="15" x2="13" y2="15" />
                </svg>
              ),
              accent: '#f59e0b',
            },
          ].map((r, i) => (
            <Reveal key={r.role} delay={i * 80}>
              <div
                style={s.roleCard}
                className="role-card"
                onClick={() => triggerRoleSwitch(r.role)}
              >
                <div style={{ marginBottom: 16 }}>{r.icon(r.accent)}</div>
                <h3 style={{ ...s.roleTitle, color: r.accent }}>{r.title}</h3>
                <p style={s.roleDesc}>{r.desc}</p>
                <div style={s.roleArrow}>
                  Tester le portail <span style={{ color: r.accent }}>→</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section style={s.ctaBanner}>
        <div style={s.ctaOrb1} />
        <div style={s.ctaOrb2} />
        <Reveal>
          <h2 style={s.ctaH2}>Prêt à transformer<br />votre clinique ?</h2>
          <p style={s.ctaP}>Rejoignez les établissements africains qui font confiance à MedClinik.</p>
          <button style={s.ctaBtnLarge} onClick={() => setShowLogin(true)}>
            Accéder au portail
          </button>
        </Reveal>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <span style={s.footerBrand}>Med<span style={s.navBrandAccent}>Clinik</span></span>
            <p style={s.footerTagline}>Système intégré de gestion clinique.<br />Conçu pour l'Afrique.</p>
          </div>
          <div style={s.footerLinks}>
            {[
              { title: 'Produit', links: ['Fonctionnalités', 'Portails Métiers', 'Wave Pay'] },
              { title: 'Sécurité', links: ['2FA SMS', 'Dossier Chiffré', 'Audit Logs'] },
            ].map(col => (
              <div key={col.title}>
                <div style={s.footerColTitle}>{col.title}</div>
                {col.links.map(l => <div key={l} style={s.footerColLink}>{l}</div>)}
              </div>
            ))}
          </div>
        </div>
        <div style={s.footerBottom}>
          © {new Date().getFullYear()} MedClinik ERP. Tous droits réservés.
        </div>
      </footer>

      {/* ── LOGIN OVERLAY ─────────────────────────────────────────────────── */}
      {showLogin && (
        <div style={s.loginOverlay}>
          <LoginView onClose={() => setShowLogin(false)} />
        </div>
      )}
    </div>
  );
};

// ─── INLINE COMPONENTS ────────────────────────────────────────────────────────

const PatientCard: React.FC = () => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.75rem', maxWidth: 360 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>AB</div>
      <div>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Amadou Ba</div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>DMP · N° 2024-01847</div>
      </div>
      <span style={{ marginLeft: 'auto', background: 'rgba(52,211,153,0.12)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>Actif</span>
    </div>
    {[
      { label: 'Groupe sanguin', value: 'O+' },
      { label: 'Allergies', value: 'Pénicilline' },
      { label: 'Pression artérielle', value: '120/80 mmHg' },
      { label: 'Dernière consultation', value: '28 mai 2025' },
    ].map(row => (
      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{row.value}</span>
      </div>
    ))}
  </div>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .anim-fade-up {
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) both;
  }
  .anim-delay-1 { animation-delay: 0.15s; }
  .anim-delay-2 { animation-delay: 0.28s; }
  .anim-delay-3 { animation-delay: 0.40s; }
  .anim-delay-4 { animation-delay: 0.55s; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .role-card:hover {
    transform: translateY(-6px) scale(1.015);
    border-color: rgba(255,255,255,0.14) !important;
    background: rgba(255,255,255,0.05) !important;
  }
`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    background: '#06080f',
    color: '#f0f0f5',
    fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
    minHeight: '100vh',
    overflowX: 'hidden',
  },

  // NAV
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 40px', height: 56,
    transition: 'background 0.4s, backdrop-filter 0.4s, border-color 0.4s',
    borderBottom: '1px solid transparent',
  },
  navScrolled: {
    background: 'rgba(6,8,15,0.78)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navBrand: {
    fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', cursor: 'pointer',
  },
  navBrandAccent: { color: '#60a5fa' },
  navCenter: { display: 'flex', gap: 32 },
  navLink: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
    fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'color 0.2s',
  },
  navCta: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: '0.85rem', fontWeight: 600,
    padding: '7px 18px', borderRadius: 99, cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },

  // HERO
  hero: {
    position: 'relative', paddingTop: 130, paddingBottom: 100,
    textAlign: 'center', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  orb1: {
    position: 'absolute', top: -200, left: '15%', width: 600, height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', top: -100, right: '10%', width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroInner: { position: 'relative', maxWidth: 800, padding: '0 24px' },
  heroEyebrow: { marginBottom: 24 },
  heroPill: {
    display: 'inline-block',
    background: 'rgba(96,165,250,0.1)',
    border: '1px solid rgba(96,165,250,0.25)',
    color: '#93c5fd',
    fontSize: '0.82rem', fontWeight: 600,
    padding: '6px 16px', borderRadius: 99,
  },
  heroH1: {
    fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: '-0.04em',
    color: '#fff',
    marginBottom: 28,
  },
  heroGrad: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: '1.15rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)',
    maxWidth: 540, margin: '0 auto 36px',
  },
  heroCtas: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    background: '#fff', color: '#06080f',
    border: 'none', borderRadius: 99,
    fontSize: '0.95rem', fontWeight: 700,
    padding: '13px 32px', cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s, transform 0.2s',
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    borderRadius: 99, fontSize: '0.95rem', fontWeight: 600,
    padding: '13px 32px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  heroDashWrap: {
    position: 'relative', marginTop: 80, width: '100%', maxWidth: 820, padding: '0 24px',
  },
  heroDash: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 60px 120px rgba(0,0,0,0.5)',
  },
  dashBar: {
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12,
  },
  dashDots: { display: 'flex', gap: 6 },
  dashUrl: {
    fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)',
    background: 'rgba(0,0,0,0.2)', padding: '3px 20px',
    borderRadius: 6, flex: 1, textAlign: 'center',
    fontFamily: 'monospace',
  },
  dashBody: { padding: '1.5rem' },
  dashHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.25rem', paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  dashClinic: { fontSize: '0.95rem', fontWeight: 700, color: '#fff' },
  dashOnline: { fontSize: '0.7rem', color: '#34d399', marginTop: 2 },
  dashBadge: {
    background: 'rgba(96,165,250,0.1)', color: '#93c5fd',
    fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6,
  },
  dashKpis: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.25rem',
  },
  dashKpi: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12, padding: '0.85rem',
  },
  dashKpiLabel: { fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  dashKpiVal: { fontSize: '1rem', fontWeight: 800, color: '#fff' },
  dashChart: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12, padding: '0.85rem',
  },

  // STATS
  stats: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '60px 40px',
  },
  statsInner: {
    maxWidth: 900, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24,
  },
  statCard: { textAlign: 'center' },
  statNum: {
    fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800,
    letterSpacing: '-0.03em', color: '#fff', marginBottom: 6,
  },
  statLabel: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 },

  // SECTIONS
  section: {
    maxWidth: 1100, margin: '0 auto', padding: '120px 40px',
  },
  sectionEye: {
    fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: '#60a5fa', marginBottom: 16,
  },
  sectionH2: {
    fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 800,
    lineHeight: 1.1, letterSpacing: '-0.035em', color: '#fff',
    marginBottom: 16,
  },
  sectionSub: {
    fontSize: '1.05rem', color: 'rgba(255,255,255,0.45)', maxWidth: 520, lineHeight: 1.6,
  },

  // FEATURE BIG
  featureBig: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64,
    alignItems: 'center', margin: '80px 0',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 28, padding: '56px 56px',
  },
  featureBigText: {},
  featureTag: {
    display: 'inline-block',
    background: 'rgba(52,211,153,0.1)', color: '#34d399',
    fontSize: '0.78rem', fontWeight: 700,
    padding: '5px 12px', borderRadius: 99, marginBottom: 20,
  },
  featureBigH3: {
    fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em',
    color: '#fff', lineHeight: 1.2, marginBottom: 16,
  },
  featureBigP: {
    fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)',
  },
  featureBigViz: { display: 'flex', justifyContent: 'center' },

  // FEAT GRID
  featGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20,
  },
  featCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, padding: '32px',
    display: 'flex', flexDirection: 'column',
    transition: 'border-color 0.3s, background 0.3s',
  },
  featCardH4: {
    fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 10,
  },
  featCardP: {
    fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.45)', flex: 1,
  },

  // WAVE
  waveSec: {
    position: 'relative', overflow: 'hidden',
    background: 'rgba(255,255,255,0.015)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '120px 40px',
  },
  waveOrb: {
    position: 'absolute', top: '-30%', left: '-10%',
    width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(28,164,232,0.07) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  waveInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80,
    alignItems: 'center', position: 'relative',
  },
  waveText: {},
  waveBadge: {
    display: 'inline-block',
    background: 'rgba(28,164,232,0.1)', color: '#38bdf8',
    fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px',
    borderRadius: 99, marginBottom: 24,
  },
  waveH2: {
    fontSize: 'clamp(1.8rem,3.5vw,3rem)', fontWeight: 800,
    letterSpacing: '-0.035em', color: '#fff', lineHeight: 1.15, marginBottom: 20,
  },
  waveP: {
    fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', marginBottom: 32,
  },
  waveChecks: { display: 'flex', flexDirection: 'column', gap: 14 },
  waveCheck: { display: 'flex', gap: 12, fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', alignItems: 'center' },
  waveCheckIcon: { color: '#1ca4e8', fontWeight: 800, fontSize: '1.1rem' },
  wavePhone: { display: 'flex', justifyContent: 'center' },
  waveMockupImage: {
    width: '100%',
    maxWidth: '320px',
    borderRadius: '24px',
    boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },

  // ROLES
  rolesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 60,
  },
  roleCard: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, padding: '32px 28px',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, background 0.3s',
  },
  roleTitle: { fontSize: '1.1rem', fontWeight: 800, marginBottom: 10 },
  roleDesc: { fontSize: '0.85rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.45)', flex: 1 },
  roleArrow: { fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: 20 },

  // CTA BANNER
  ctaBanner: {
    position: 'relative', overflow: 'hidden',
    padding: '140px 40px', textAlign: 'center',
  },
  ctaOrb1: {
    position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%,-50%)',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  ctaOrb2: {
    position: 'absolute', top: '50%', right: '15%', transform: 'translate(50%,-50%)',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  ctaH2: {
    fontSize: 'clamp(2.2rem,5vw,4.5rem)', fontWeight: 800,
    letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: 20,
  },
  ctaP: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.45)', marginBottom: 40 },
  ctaBtnLarge: {
    background: '#fff', color: '#06080f',
    border: 'none', borderRadius: 99,
    fontSize: '1.05rem', fontWeight: 700,
    padding: '16px 48px', cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // FOOTER
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '64px 40px 32px',
  },
  footerInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '1.5fr 1fr',
    gap: 64, paddingBottom: 48,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  footerBrand: { fontSize: '1.2rem', fontWeight: 800, color: '#fff' },
  footerTagline: {
    marginTop: 12, fontSize: '0.88rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.65,
  },
  footerLinks: { display: 'flex', gap: 48 },
  footerColTitle: {
    fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: 16,
  },
  footerColLink: {
    fontSize: '0.88rem', color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.4,
  },
  footerBottom: {
    maxWidth: 1100, margin: '24px auto 0',
    fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center',
  },

  // LOGIN
  loginOverlay: {
    position: 'fixed', inset: 0, zIndex: 999,
    background: 'rgba(6,8,15,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};