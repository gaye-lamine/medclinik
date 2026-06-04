'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Logo } from './Logo';

export const LoginView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { login, error, isLoading, triggerRoleSwitch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Identifiants incorrects.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card animate-slide-up" style={{ position: 'relative' }}>
        {onClose && (
          <button
            onClick={onClose}
            className="login-close-btn"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            title="Retour à l'accueil"
            type="button"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ✕
          </button>
        )}
        <div className="login-brand-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <Logo size={42} mode="neon" />
          <h2 className="login-brand" style={{ margin: '0.5rem 0 0.2rem 0' }}>Med<span>Clinik</span></h2>
          <p className="login-subtitle">Portail Sécurisé Clinique &amp; Gestion ERP</p>
        </div>

        {(error || localError) && (
          <div className="login-error-banner">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>Adresse e-mail professionnelle</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@medclinik.com"
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authentification...' : 'Se connecter'}
          </button>
        </form>

        {/* Demo Role Switcher for Developer / Demonstration purposes */}
        <div className="login-demo-drawer">
          <div className="login-demo-header">Accès Démo Rapide (Hors Prod)</div>
          <div className="login-demo-grid">
            <button onClick={() => triggerRoleSwitch('ADMIN')} className="login-demo-btn">
              <strong>Administrateur</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pilote complet</span>
            </button>
            <button onClick={() => triggerRoleSwitch('DOCTOR')} className="login-demo-btn">
              <strong>Médecin</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DMP &amp; Visites</span>
            </button>
            <button onClick={() => triggerRoleSwitch('NURSE')} className="login-demo-btn">
              <strong>Infirmier</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Constantes</span>
            </button>
            <button onClick={() => triggerRoleSwitch('CASHIER')} className="login-demo-btn">
              <strong>Caissier</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facturation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
