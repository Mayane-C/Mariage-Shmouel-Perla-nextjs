'use client';

import { useEffect, useState } from 'react';

/**
 * Deux flèches or fixées sur les côtés gauche et droit du viewport.
 * Ne défilent jamais avec la page. Apparaissent quand la vidéo se
 * fige (body.revealed + user proche du haut de la zone blocs) pour
 * inviter à scroller et faire avancer la vidéo. Disparaissent quand
 * l'utilisateur a bien descendu (bas du dernier bloc visible).
 * Reprise du pattern BM Chmouel.
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

export function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (!document.body.classList.contains('revealed')) {
        setVisible(false);
        return;
      }
      const invitation = document.getElementById('invitation');
      const rsvp = document.querySelector<HTMLElement>('.rsvp');
      if (!invitation || !rsvp) {
        setVisible(false);
        return;
      }
      const sy = window.scrollY;
      const vH = window.innerHeight;
      // Apparition : le bas du faire-part a atteint le bas du viewport
      // (l'invité a vu au moins l'essentiel du bloc, la vidéo est figée)
      const showAt = sy > invitation.offsetTop + invitation.offsetHeight - vH;
      // Disparition : on est descendu au niveau du bas du bloc RSVP
      const hideAt = sy > rsvp.offsetTop + rsvp.offsetHeight - vH * 0.6;
      setVisible(showAt && !hideAt);
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    // Réévalue régulièrement pendant la 1re seconde après le clic sur
    // 'Voir l'invitation' — le body.revealed est ajouté à t=4.5s après
    // le clic, potentiellement sans scroll donc sans event scroll.
    const interval = window.setInterval(compute, 300);
    compute();
    return () => {
      window.removeEventListener('scroll', schedule, {} as EventListenerOptions);
      window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
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
