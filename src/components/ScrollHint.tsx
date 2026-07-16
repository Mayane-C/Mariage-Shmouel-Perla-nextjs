'use client';

import { useEffect, useState } from 'react';

/**
 * Deux flèches or fixées sur les côtés gauche et droit du viewport.
 * Visibilité pilotée par la POSITION du bloc hébreu dans le viewport
 * (approche BM Chmouel) plutôt que par un event scroll one-shot — ce
 * dernier était fragile sur iOS Safari où la barre d'URL qui se cache
 * en scroll auto déclenchait un scroll fantôme qui faisait disparaître
 * les flèches instantanément.
 *
 * Règle : flèches visibles pendant que le bloc hébreu occupe (au moins
 * partiellement) le viewport, cachées dès qu'on a scrollé au-delà.
 * Décalage initial : 2.4 s après body.revealed pour laisser le
 * glissement du bloc se terminer avant que les flèches n'apparaissent.
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

const REVEAL_DELAY_MS = 2400;

export function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let pollInterval: number | null = null;
    let startTimer: number | null = null;
    let tickInterval: number | null = null;
    let onScroll: (() => void) | null = null;

    const updateVisibility = () => {
      const heBlock = document.querySelector<HTMLElement>('.invitation-formal-he');
      if (!heBlock) {
        setVisible(false);
        return;
      }
      const rect = heBlock.getBoundingClientRect();
      const vH = window.innerHeight;
      // Visible tant que le bloc hébreu a une portion dans le viewport
      // ET que son bas est encore en dessous du milieu du viewport
      // (= l'utilisateur regarde encore majoritairement le bloc).
      const partiallyInView = rect.top < vH && rect.bottom > 0;
      const notScrolledPast = rect.bottom > vH * 0.5;
      setVisible(partiallyInView && notScrolledPast);
    };

    const startTracking = () => {
      onScroll = updateVisibility;
      window.addEventListener('scroll', onScroll, { passive: true });
      // Filet de sécurité : ré-évalue régulièrement au cas où le DOM
      // ait bougé (reveal des blocs, mobile URL bar collapse, etc.)
      tickInterval = window.setInterval(updateVisibility, 500);
      updateVisibility();
    };

    // Attend body.revealed + le délai du glissement, puis commence à
    // tracker la position du bloc.
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
      if (tickInterval !== null) window.clearInterval(tickInterval);
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
