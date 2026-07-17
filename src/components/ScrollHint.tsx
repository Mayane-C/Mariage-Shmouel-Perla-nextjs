'use client';

import { useEffect, useState } from 'react';

/**
 * Deux flèches or fixées sur les côtés gauche et droit du viewport.
 * Visibilité pilotée par la POSITION du premier bloc (le faire-part
 * français) dans le viewport, approche BM Chmouel — plus fragile qu'un
 * simple scroll event one-shot qui pouvait fire à cause de la barre
 * d'URL iOS Safari.
 *
 * Règle : flèches visibles tant que le faire-part est encore présent
 * dans le viewport (bas > 35% de vH), cachées dès qu'on a scrollé
 * au-delà. Décalage : 2 s après body.revealed pour laisser le
 * glissement du bloc se terminer.
 */
function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="scroll-hint-arrow"
    >
      <path d="M6 9 L 12 15 L 18 9" />
      <path d="M6 4 L 12 10 L 18 4" opacity="0.55" />
    </svg>
  );
}

const REVEAL_DELAY_MS = 2000;

export function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let pollInterval: number | null = null;
    let startTimer: number | null = null;
    let onScroll: (() => void) | null = null;

    // Cache-uniquement : n'affiche jamais si l'utilisateur a déjà scrollé
    // au-delà du bloc hébreu. Ne re-montre pas s'il revient en arrière
    // (simple et prévisible, comme l'expérience BM).
    const hideCheck = () => {
      const heBlock = document.querySelector<HTMLElement>('.invitation-formal');
      if (!heBlock) return;
      const rect = heBlock.getBoundingClientRect();
      const vH = window.innerHeight;
      // Cache dès que le bas du bloc passe au-dessus de 35% du viewport
      // (= utilisateur a scrollé significativement au-delà)
      if (rect.bottom < vH * 0.35) {
        setVisible(false);
        if (onScroll) {
          window.removeEventListener('scroll', onScroll);
          onScroll = null;
        }
      }
    };

    const startTracking = () => {
      // Affichage inconditionnel après le délai — pas de check position
      // initial qui pourrait retourner false à cause d'un timing subtil
      // (fin d'animation, URL bar iOS, etc.). Les flèches DOIVENT être
      // visibles au moment où l'utilisateur peut interagir.
      setVisible(true);
      onScroll = hideCheck;
      window.addEventListener('scroll', onScroll, { passive: true });
    };

    pollInterval = window.setInterval(() => {
      if (document.body.classList.contains('revealed')) {
        window.clearInterval(pollInterval!);
        pollInterval = null;
        startTimer = window.setTimeout(startTracking, REVEAL_DELAY_MS);
      }
    }, 200);

    return () => {
      if (pollInterval !== null) window.clearInterval(pollInterval);
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (onScroll) window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className={`scroll-hint ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <div className="scroll-hint-side scroll-hint-left">
        <Arrow />
      </div>
      <div className="scroll-hint-side scroll-hint-right">
        <Arrow />
      </div>
    </div>
  );
}
