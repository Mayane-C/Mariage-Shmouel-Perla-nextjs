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

// = 600 ms d'attente du scroll settle + ~2 s de spring BM = ~2.6 s
const REVEAL_DELAY_MS = 2600;

export function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let pollInterval: number | null = null;
    let startTimer: number | null = null;
    let onScroll: (() => void) | null = null;

    const startTracking = () => {
      setVisible(true);
      // Cache dès le premier scroll significatif (> 30 px du point
      // initial) — seuil pour ignorer les scrolls fantômes iOS Safari
      // (URL bar qui se cache/apparaît génère de faux scroll events).
      const initialScrollY = window.scrollY;
      onScroll = () => {
        if (Math.abs(window.scrollY - initialScrollY) > 30) {
          setVisible(false);
          if (onScroll) {
            window.removeEventListener('scroll', onScroll);
            onScroll = null;
          }
        }
      };
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
