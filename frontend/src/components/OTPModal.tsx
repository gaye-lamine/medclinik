'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const OTPModal: React.FC = () => {
  const { showOtpModal, phoneDigits, submitOtp, cancelOtp, error } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showOtpModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setIsSubmitting(true);
    const success = await submitOtp(code);
    setIsSubmitting(false);
    if (success) {
      setCode('');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="glass-card animate-slide-up">
        <h3 style={styles.title}>Authentification à Deux Facteurs (2FA)</h3>
        <p style={styles.desc}>
          Un code de validation à 6 chiffres a été envoyé par SMS au numéro : 
          <strong style={styles.phone}> {phoneDigits}</strong>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <input
              type="text"
              maxLength={6}
              placeholder="0 0 0 0 0 0"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={styles.input}
              className="form-input"
              autoFocus
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={cancelOtp}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={code.length < 6 || isSubmitting}
            >
              {isSubmitting ? 'Vérification...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modal: {
    maxWidth: '450px',
    width: '90%',
    padding: '2rem',
    borderRadius: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.4rem',
    marginBottom: '1rem',
    color: 'hsl(190, 85%, 45%)',
  },
  desc: {
    fontSize: '0.95rem',
    color: 'hsl(215, 20%, 75%)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  phone: {
    color: '#fff',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    textAlign: 'center',
    fontSize: '2rem',
    letterSpacing: '0.5rem',
    fontWeight: 'bold',
    padding: '0.5rem',
    borderRadius: '8px',
    width: '100%',
  },
  demoHint: {
    fontSize: '0.8rem',
    color: 'hsl(38, 95%, 55%)',
    marginTop: '0.5rem',
  },
  error: {
    color: 'hsl(355, 80%, 55%)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem',
    gap: '1rem',
  },
};
