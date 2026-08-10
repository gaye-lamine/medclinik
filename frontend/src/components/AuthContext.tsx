'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'CASHIER';

// ─── Utilitaire de traduction des erreurs réseau ───────────────────────────
/**
 * Traduit les erreurs brutes (TypeError réseau, erreurs HTTP) en messages
 * lisibles en français. Empêche l'affichage de "Failed to fetch" ou de
 * messages d'erreur techniques exposés à l'utilisateur final.
 */
function parseApiError(e: unknown, fallback = "Une erreur inattendue s'est produite."): string {
  // 1. Erreur réseau ou CORS (TypeError lancé par fetch)
  if (e instanceof TypeError) {
    if (e.message.toLowerCase().includes('failed to fetch') || e.message.toLowerCase().includes('networkerror')) {
      return 'Impossible de joindre le serveur. Veuillez vérifier votre connexion ou réessayer plus tard.';
    }
    if (e.message.toLowerCase().includes('cors')) {
      return 'Accès refusé. Veuillez contacter votre administrateur.';
    }
    return `Erreur réseau : ${e.message}`;
  }
  // 2. Erreur HTTP structurée (objet avec message)
  if (e && typeof e === 'object') {
    const err = e as Record<string, any>;
    const msg = err.message;
    if (typeof msg === 'string' && msg.length > 0 && !msg.toLowerCase().includes('failed to fetch')) {
      return msg;
    }
  }
  // 3. String brute
  if (typeof e === 'string' && e.length > 0) {
    return e;
  }
  return fallback;
}

// ─── Traduction des codes HTTP standard ──────────────────────────────────────
function httpStatusToMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La requête est invalide. Vérifiez les données saisies.',
    401: 'Session expirée ou non authentifié. Veuillez vous reconnecter.',
    403: 'Vous n\'avez pas les droits nécessaires pour cette action.',
    404: 'La ressource demandée est introuvable.',
    409: 'Un conflit de données a été détecté (doublon possible).',
    422: 'Les données envoyées ne respectent pas les règles de validation.',
    429: 'Trop de requêtes. Veuillez patienter quelques secondes.',
    500: 'Erreur interne du serveur. Notre équipe a été notifiée.',
    502: 'Le serveur est temporairement indisponible. Réessayez plus tard.',
    503: 'Service en maintenance. Veuillez réessayer dans quelques minutes.',
  };
  return messages[status] ?? `Erreur inattendue (code ${status}). Veuillez réessayer.`;
}

export const ROLE_LABELS: Record<Role | string, string> = {
  ADMIN: 'Administrateur',
  DOCTOR: 'Médecin',
  NURSE: 'Infirmier',
  CASHIER: 'Caissier',
};

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  showOtpModal: boolean;
  pendingRole: Role | null;
  tempToken: string | null;
  phoneDigits: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  triggerRoleSwitch: (role: Role) => void;
  submitOtp: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

// Préfixe REST : tous les appels HTTP vers le backend passent par /api
// (WebSocket et fichiers statiques /uploads utilisent API_URL directement)
const API_REST_URL = `${API_URL}/api`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2FA Flow state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState('');

  // Initial load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${API_REST_URL}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        // Protected calls will surface a network error if the API is unavailable.
      } finally {
        setIsLoading(false);
      }
    };
    void restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_REST_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Email ou mot de passe incorrect');
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setShowOtpModal(false);
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } else {
        setTempToken(data.tempToken);
        setPhoneDigits(data.phone);
        setShowOtpModal(true);
      }
    } catch (e: unknown) {
      const message = parseApiError(e, 'Erreur lors de la connexion.');
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_REST_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      setError(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const triggerRoleSwitch = async (role: Role) => {
    setError(null);
    try {
      const res = await fetch(`${API_REST_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Authentification démo échouée');
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setShowOtpModal(false);
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } else {
        setPendingRole(role);
        setTempToken(data.tempToken);
        setPhoneDigits(data.phone);
        setShowOtpModal(true); // Open 2FA Screen
      }
    } catch (e: unknown) {
      setError(parseApiError(e, 'Erreur lors du changement de rôle.'));
    }
  };

  const submitOtp = async (code: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_REST_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Code OTP incorrect');
      }

      const data = await res.json();
      setUser(data.user);
      
      setShowOtpModal(false);
      setPendingRole(null);
      setTempToken(null);
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return true;
    } catch (e: unknown) {
      setError(parseApiError(e, 'Code OTP incorrect ou expiré.'));
      return false;
    }
  };

  const cancelOtp = () => {
    setShowOtpModal(false);
    setPendingRole(null);
    setTempToken(null);
    setError(null);
  };

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = {
      ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    let res: Response;
    try {
      res = await fetch(`${API_REST_URL}${path}`, { ...options, headers, credentials: 'include' });
    } catch (networkError: unknown) {
      // Erreur réseau (serveur hors-ligne, CORS preflight bloqué, etc.)
      throw new Error(parseApiError(networkError, 'Impossible de joindre le serveur.'));
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      // Préférer le message métier fourni par GlobalExceptionFilter
      const message = errData.message
        ? errData.message
        : httpStatusToMessage(res.status);
      throw { status: res.status, message, errorCode: errData.errorCode };
    }

    return res.json().catch(() => ({}));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        showOtpModal,
        pendingRole,
        tempToken,
        phoneDigits,
        login,
        logout,
        triggerRoleSwitch,
        submitOtp,
        cancelOtp,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
