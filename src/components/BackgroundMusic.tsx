'use client';

import { useEffect, useRef, useState } from 'react';
import { content } from '@/lib/content';

/**
 * Musique d'ambiance (Od Yishama) déclenchée au clic sur le bouton
 * « Voir l'invitation ». On écoute le même bouton .btn-hero que
 * BackgroundVideo, via un addEventListener natif — nécessaire pour
 * que le play() soit vu comme user-gesture par Safari.
 *
 * Un petit bouton pastille flottant en bas à droite permet de couper
 * ou remettre le son à tout moment.
 */
export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.35;
    el.loop = true;

    const play = () => {
      el.play()
        .then(() => setStarted(true))
        .catch(() => {
          // Autoplay refusé — on retente sur le prochain pointerdown
          const retry = () => {
            el.play().then(() => setStarted(true)).catch(() => {});
          };
          window.addEventListener('pointerdown', retry, { once: true });
          window.addEventListener('touchstart', retry, { once: true });
        });
    };

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = () => {
      if (started) return;
      play();
    };
    revealBtn?.addEventListener('click', onRevealClick);
    return () => {
      revealBtn?.removeEventListener('click', onRevealClick);
    };
  }, [started]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!started) {
      el.play().then(() => setStarted(true)).catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src={content.images.music} preload="auto" playsInline />
      <button
        type="button"
        className="music-toggle"
        aria-label={muted ? 'Activer la musique' : 'Couper la musique'}
        onClick={toggle}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </>
  );
}
