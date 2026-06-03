'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { Navbar } from './Navbar';
import { LoginView } from './LoginView';

import { usePathname } from 'next/navigation';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Initialisation sécurisée de MedClinik...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const isDisplayPage = pathname === '/queue/display';

  if (isDisplayPage) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content animate-fade-in">
        {children}
      </main>
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'hsl(222, 40%, 8%)',
  }
};
