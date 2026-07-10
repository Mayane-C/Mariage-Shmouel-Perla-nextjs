'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par séquence de frames JPG (comme le BM Chmouel).
 *
 * Pourquoi une séquence d'images plutôt qu'une <video> scrubbée ?
 *   → Chaque frame est une image statique, décodée une fois puis mise en
 *     cache par le navigateur. Le scroll qui déclenche un swap de `src`
 *     est instantané (pas de décodage codec, pas de seek). Le rendu est
 *     100 % smooth même sur mobile Safari.
 *
 * Phases :
 *   ┌─────────────────────┬──────────────────────────────────────────┐
 *   │ Hero (avant clic)   │ Frame 1 figée                            │
 *   │ Intro (2.5 s au clic│ Animation 1 → INTRO_END_IDX (ease-out)   │
 *   │ Scroll après reveal │ INTRO_END_IDX → TOTAL (piloté par scroll)│
 *   └─────────────────────┴──────────────────────────────────────────┘
 */

const TOTAL = 253;
const INTRO_END_IDX = Math.round(TOTAL * 0.65); // ~164
const INTRO_DURATION_MS = 2500;

const frameSrc = (i: number) =>
  `/frames/frame-${String(Math.max(1, Math.min(TOTAL, i))).padStart(3, '0')}.jpg`;

export function BackgroundVideo() {
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);

  useEffect(() => {
    // ── Préchargement de toutes les frames ──────────────────────────
    // On les met en cache dès le mount ; le hero reste sur la frame 1
    // pendant que les autres se téléchargent en arrière-plan.
    const preloadImages: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL; i++) {
      const im = new Image();
      im.src = frameSrc(i);
      preloadImages.push(im);
    }

    const setFrame = (idx: number) => {
      const clamped = Math.max(1, Math.min(TOTAL, Math.round(idx)));
      if (clamped === currentIdxRef.current) return;
      currentIdxRef.current = clamped;
      if (layerARef.current) layerARef.current.src = frameSrc(clamped);
    };

    // ── Reveal + intro animation ────────────────────────────────────
    const doRevealAndScroll = () => {
      document.body.classList.add('revealed');
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 320);
    };

    const animateIntro = (from: number, to: number, done?: () => void) => {
      const start = performance.now();
      const run = (now: number) => {
        const t = Math.min(1, (now - start) / INTRO_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        setFrame(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(run);
        else done?.();
      };
      requestAnimationFrame(run);
    };

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (document.body.classList.contains('revealed')) return;
      document.querySelector('.hero')?.classList.add('fading-out');
      animateIntro(1, INTRO_END_IDX, doRevealAndScroll);
      setTimeout(() => {
        if (!document.body.classList.contains('revealed')) doRevealAndScroll();
      }, INTRO_DURATION_MS + 3000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

    // ── Scroll → frame index ─────────────────────────────────────────
    let ticking = false;
    const onScroll = () => {
      if (!document.body.classList.contains('revealed')) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const block1 = document.getElementById('invitation');
        const lastBlock = document.querySelector('.rsvp');
        if (!block1 || !lastBlock) return;

        const startY = (block1 as HTMLElement).offsetTop - window.innerHeight * 0.5;
        const endY =
          (lastBlock as HTMLElement).offsetTop +
          (lastBlock as HTMLElement).offsetHeight -
          window.innerHeight * 0.5;
        const range = Math.max(1, endY - startY);
        const progress = Math.min(1, Math.max(0, (window.scrollY - startY) / range));

        const target = INTRO_END_IDX + progress * (TOTAL - INTRO_END_IDX);
        targetIdxRef.current = target;
        // Interpolation douce pour lisser les micro-sauts de scroll
        const smooth = currentIdxRef.current + (target - currentIdxRef.current) * 0.35;
        setFrame(smooth);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Frame initiale
    setFrame(1);

    return () => {
      revealBtn?.removeEventListener('click', onRevealClick);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div className="bg-video" aria-hidden="true">
        <img
          ref={layerARef}
          src={frameSrc(1)}
          alt=""
          className="bg-frame"
          decoding="async"
        />
        <img ref={layerBRef} alt="" className="bg-frame" style={{ display: 'none' }} decoding="async" />
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
