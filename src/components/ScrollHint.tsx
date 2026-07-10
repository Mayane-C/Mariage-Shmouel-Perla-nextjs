'use client';

import { useEffect, useState } from 'react';

/**
 * Deux flèches or fixées sur les côtés gauche et droit du viewport.
 * Apparition : ~3.4 s après que body.revealed soit ajouté — le bloc
 * faire-part est alors en place et la phase B vidéo terminée.
 * Disparition : dès le premier scroll utilisateur (l'invite a été vue).
 */
function Arrow() {
  return (
    <svg
      width="32"
      height="32"
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

// Durée qu'on attend après body.revealed avant d'afficher l'invite.
// Correspond à la fin du glissement du bloc (3.4 s desktop) — la vidéo,
// elle, se fige immédiatement à body.revealed.
const SHOW_AFTER_REVEALED_MS = 3400;

export function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let pollInterval: number | null = null;
    let showTimer: number | null = null;
    let scrollHandler: (() => void) | null = null;

    // Étape 1 : attend que body.revealed soit ajouté (fin de phase A + 1s)
    pollInterval = window.setInterval(() => {
      if (document.body.classList.contains('revealed')) {
        window.clearInterval(pollInterval!);
        pollInterval = null;
        // Étape 2 : attend que le bloc et la vidéo aient fini leur transition
        showTimer = window.setTimeout(() => {
          setVisible(true);
          // Étape 3 : cache dès le premier scroll de l'utilisateur
          scrollHandler = () => {
            setVisible(false);
            if (scrollHandler) {
              window.removeEventListener('scroll', scrollHandler);
              scrollHandler = null;
            }
          };
          window.addEventListener('scroll', scrollHandler, { passive: true });
        }, SHOW_AFTER_REVEALED_MS);
      }
    }, 200);

    return () => {
      if (pollInterval !== null) window.clearInterval(pollInterval);
      if (showTimer !== null) window.clearTimeout(showTimer);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
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
