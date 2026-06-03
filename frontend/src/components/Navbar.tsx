'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, Role, ROLE_LABELS } from './AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getRoleLabel = (role?: string) => {
    return role ? ROLE_LABELS[role] || role : '';
  };

  const getNavLinks = (role?: string) => {
    const base = [
      { href: '/', label: 'Tableau de bord' },
      { href: '/agenda', label: 'Agenda' },
      { href: '/queue', label: 'File d\'attente' },
      { href: '/patients', label: 'Patients' },
    ];

    if (role === 'ADMIN') {
      return [
        ...base,
        { href: '/personnel', label: 'Personnel' },
        { href: '/caisse', label: 'Caisse & Factures' },
        { href: '/constantes', label: 'Constantes Vitales' },
        { href: '/consultation', label: 'Consultations (DMP)' },
        { href: '/stock', label: 'Pharmacie' },
        { href: '/reports', label: 'Rapports' },
      ];
    }
    if (role === 'CASHIER') {
      return [
        ...base,
        { href: '/caisse', label: 'Caisse & Factures' },
      ];
    }
    if (role === 'NURSE') {
      return [
        ...base,
        { href: '/constantes', label: 'Constantes Vitales' },
        { href: '/stock', label: 'Pharmacie' },
      ];
    }
    if (role === 'DOCTOR') {
      return [
        ...base,
        { href: '/consultation', label: 'Consultations (DMP)' },
        { href: '/stock', label: 'Pharmacie' },
        { href: '/reports', label: 'Rapports' },
      ];
    }
    return base;
  };

  const navLinks = getNavLinks(user?.role);

  return (
    <header className="navbar">
      <Link href="/" className="nav-brand">
        Med<span>Clinik</span>
      </Link>

      <nav style={styles.nav}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div style={styles.userContainer}>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.name}</span>
          <span style={styles.userRole}>{getRoleLabel(user?.role)}</span>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'center',
  },
  link: {
    color: 'hsl(215, 20%, 75%)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  activeLink: {
    color: 'hsl(190, 85%, 45%)',
    background: 'rgba(6, 182, 212, 0.08)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff',
  },
  userContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
};
