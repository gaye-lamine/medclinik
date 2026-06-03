import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../components/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { OTPModal } from '../components/OTPModal';

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
          <AppLayout>
            {children}
          </AppLayout>
          <OTPModal />
        </AuthProvider>
      </body>
    </html>
  );
}
