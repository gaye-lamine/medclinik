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
    <div className="otp-overlay">
      <div className="otp-modal glass-card animate-slide-up">
        <h3 className="otp-title">Authentification à Deux Facteurs (2FA)</h3>
        <p className="otp-desc">
          Un code de validation à 6 chiffres a été envoyé par SMS au numéro : 
          <strong className="otp-phone"> {phoneDigits}</strong>
        </p>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="form-group">
            <input
              type="text"
              maxLength={6}
              placeholder="0 0 0 0 0 0"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="form-input otp-input"
              autoFocus
            />
          </div>

          {error && <div className="otp-error">{error}</div>}

          <div className="otp-actions">
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
