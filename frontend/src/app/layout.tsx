import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../components/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ToastProvider } from '../components/ToastContext';

export const metadata: Metadata = {
  title: 'MedClinik - Système de Gestion ERP Médical',
  description: 'ERP Médical Intégré pour cliniques privées en Afrique - Éradication des fuites financières, dossier médical partagé (DMP) et ordonnances sécurisées.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ToastProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
