import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mariage-perla-shmouel.vercel.app'),
  title: 'Shmouel & Perla — Save the Date',
  description:
    'Invitation au mariage de Shmouel & Perla, célébré le 3 septembre 2026 à la Salle Baccara, Bobigny.',
  openGraph: {
    title: 'Mariage — Shmouel & Perla',
    description:
      'Jeudi 3 septembre 2026 · Salle Baccara, Bobigny — Vous êtes conviés à célébrer ce grand jour.',
    type: 'website',
    locale: 'fr_FR',
    // Image OG générée dynamiquement par src/app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mariage — Shmouel & Perla',
    description:
      'Jeudi 3 septembre 2026 · Salle Baccara, Bobigny — Vous êtes conviés à célébrer ce grand jour.',
  },
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
