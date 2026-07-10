import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export si tu veux déployer sur GitHub Pages ou n'importe quel host statique.
  // Sinon commente cette ligne pour un déploiement Vercel classique (SSR possible).
  output: 'export',
  images: {
    unoptimized: true, // Compatible avec output: 'export'
  },
};

export default nextConfig;
