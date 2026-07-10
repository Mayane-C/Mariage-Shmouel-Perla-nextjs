import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shmouel & Perla — Save the Date',
  description:
    'Invitation au mariage de Shmouel & Perla, célébré le 3 septembre 2026 à la Salle Baccara, Bobigny.',
  icons: {
    icon: [
      { url: '/images/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/images/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
