'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, ROLE_LABELS } from './AuthContext';

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

      <nav className="navbar-nav">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link ${isActive ? 'navbar-link-active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="navbar-user-container">
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.name}</span>
          <span className="navbar-user-role">{getRoleLabel(user?.role)}</span>
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
