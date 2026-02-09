import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orvio Clinic Portal',
  description: 'Clinic + Pharmacy portal (kiosk signing, no patient accounts)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
