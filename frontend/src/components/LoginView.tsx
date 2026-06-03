'use client';

import React, { useState } from 'react';
import { useAuth, Role } from './AuthContext';

export const LoginView: React.FC = () => {
  const { login, error, isLoading } = useAuth();
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
    <div style={styles.container}>
      <div className="glass-card animate-slide-up" style={styles.card}>
        <div style={styles.brandContainer}>
          <h2 style={styles.brand}>Med<span>Clinik</span></h2>
          <p style={styles.subtitle}>Portail Sécurisé Clinique &amp; Gestion ERP</p>
        </div>

        {(error || localError) && (
          <div style={styles.errorBanner}>
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
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
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authentification...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'radial-gradient(circle at 50% 50%, hsl(222, 40%, 12%) 0%, hsl(224, 45%, 5%) 100%)',
    padding: '1.5rem',
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    padding: '2.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  brandContainer: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  brand: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  submitBtn: {
    marginTop: '0.75rem',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '8px',
    width: '100%',
  },
  errorBanner: {
    backgroundColor: 'var(--danger-glow)',
    border: '1px solid var(--danger)',
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  demoDrawer: {
    marginTop: '2rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.5rem',
  },
  demoHeader: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  demoBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.65rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
