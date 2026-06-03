'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'CASHIER';

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
  token: string | null;
  isLoading: boolean;
  error: string | null;
  showOtpModal: boolean;
  pendingRole: Role | null;
  tempToken: string | null;
  phoneDigits: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  triggerRoleSwitch: (role: Role) => void;
  submitOtp: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  ADMIN: { email: 'admin@medclinik.com', password: 'admin123' },
  DOCTOR: { email: 'doctor@medclinik.com', password: 'doctor123' },
  NURSE: { email: 'nurse@medclinik.com', password: 'nurse123' },
  CASHIER: { email: 'cashier@medclinik.com', password: 'cashier123' },
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2FA Flow state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState('');

  // Initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('mc_token');
    const savedUser = localStorage.getItem('mc_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Email ou mot de passe incorrect');
      }

      const data = await res.json();
      setTempToken(data.tempToken);
      setPhoneDigits(data.phone);
      setShowOtpModal(true); // Open 2FA
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la connexion');
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const triggerRoleSwitch = async (role: Role) => {
    setError(null);
    try {
      const credentials = SEED_CREDENTIALS[role];
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Authentification échouée');
      }

      const data = await res.json();
      setPendingRole(role);
      setTempToken(data.tempToken);
      setPhoneDigits(data.phone);
      setShowOtpModal(true); // Open 2FA Screen
    } catch (e: any) {
      setError(e.message || 'Erreur lors du changement de rôle');
    }
  };

  const submitOtp = async (code: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Code OTP incorrect');
      }

      const data = await res.json();
      localStorage.setItem('mc_token', data.accessToken);
      localStorage.setItem('mc_user', JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      
      setShowOtpModal(false);
      setPendingRole(null);
      setTempToken(null);
      return true;
    } catch (e: any) {
      setError(e.message || 'Code OTP incorrect');
      return false;
    }
  };

  const cancelOtp = () => {
    setShowOtpModal(false);
    setPendingRole(null);
    setTempToken(null);
    setError(null);
  };

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || `Request failed with status ${res.status}`;
      throw { status: res.status, message };
    }

    return res.json().catch(() => ({}));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
