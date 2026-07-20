'use client';

import { useEffect, useState } from 'react';
import { content } from '@/lib/content';

/**
 * Phrase hébraïque courbe en SVG textPath.
 * - Desktop : chaîne inversée pour compenser l'absence de reordering
 *   RTL le long d'un path (Chrome/Firefox desktop rendent LTR).
 * - Mobile  : chaîne dans l'ordre naturel (Safari iOS et Chrome mobile
 *   appliquent le reordering RTL automatiquement → si on inverse,
 *   ça donne un double reversal = illisible).
 */
const arcTextReversed = Array.from(content.kolSasson).reverse().join('');
const arcTextNatural = content.kolSasson;

export function HebrewArc() {
  // SSR-safe : rendu initial = version desktop (inversée). Basculé
  // vers naturel côté client si mobile détecté.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const arcText = isMobile ? arcTextReversed : arcTextNatural;

  return (
    <svg
      className="arc-wrap"
      viewBox="0 0 560 190"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={content.kolSasson}
    >
      <defs>
        <path id="arc-path" d="M 30 178 Q 280 -30 530 178" fill="none" />
      </defs>
      <text
        fontFamily="'FrankRuhlLibre','Frank Ruhl Libre','Frank Ruehl','David',serif"
        fontSize="36"
        fontWeight="700"
        fill="#A88962"
        letterSpacing="0.5"
      >
        <textPath href="#arc-path" startOffset="50%" textAnchor="middle">
          {arcText}
        </textPath>
      </text>
    </svg>
  );
}
