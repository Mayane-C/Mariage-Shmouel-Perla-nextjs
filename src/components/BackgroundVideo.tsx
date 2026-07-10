'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par séquence de frames JPG (pattern BM Chmouel).
 *
 * Optimisations pour smoothness maximale :
 *   1. Preload de TOUTES les frames au mount + décodage explicite via
 *      `img.decode()` → aucune latence de décodage à l'affichage.
 *   2. Boucle rAF continue qui interpole vers la target frame — le
 *      scroll ne fait que mettre à jour la target, pas la frame courante.
 *   3. Interpolation lissée (12 % par frame) → même sur mobile avec un
 *      scroll très rapide, la transition entre frames reste fluide.
 *   4. Frame swap = simple mise à jour de `img.src` d'une image cachée
 *      décodée → instantané, pas de repaint bloquant.
 */

const TOTAL = 506;
const INTRO_END_IDX = Math.round(TOTAL * 0.72);
const INTRO_DURATION_MS = 3500;
const SCROLL_LERP = 0.12;   // interpolation par frame pour le scroll (plus petit = plus doux)
const INTRO_LERP = 1;        // pas d'interpolation pendant l'intro (l'animation JS s'en charge)

const frameSrc = (i: number) =>
  `/frames/frame-${String(Math.max(1, Math.min(TOTAL, i))).padStart(3, '0')}.jpg`;

export function BackgroundVideo() {
  const layerRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);
  const revealedRef = useRef(false);
  const introPlayingRef = useRef(false);

  useEffect(() => {
    // ── Préchargement + décodage ────────────────────────────────────
    let cancelled = false;
    const loaded: HTMLImageElement[] = [];
    (async () => {
      for (let i = 1; i <= TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = frameSrc(i);
        loaded.push(im);
        try {
          await im.decode();
        } catch {
          /* La frame chargera à l'affichage si le décodage sync échoue */
        }
      }
    })();

    // ── Boucle rAF continue ──────────────────────────────────────────
    let rafId = 0;
    const tick = () => {
      const lerp = introPlayingRef.current ? INTRO_LERP : SCROLL_LERP;
      const diff = targetIdxRef.current - currentIdxRef.current;
      if (Math.abs(diff) > 0.05) {
        currentIdxRef.current += diff * lerp;
        const clamped = Math.max(1, Math.min(TOTAL, Math.round(currentIdxRef.current)));
        if (layerRef.current && layerRef.current.dataset.idx !== String(clamped)) {
          layerRef.current.src = frameSrc(clamped);
          layerRef.current.dataset.idx = String(clamped);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // ── Reveal + intro animation ────────────────────────────────────
    // Le bloc faire-part commence à apparaître AVANT la fin de l'intro
    // vidéo, pour un effet en simultanée (la caméra approche la tente
    // + le bloc se lève en même temps). Le scroll vers #invitation
    // ne se déclenche que quand l'intro est réellement terminée.
    const REVEAL_TRIGGER_RATIO = 0.60; // 60 % de INTRO_DURATION_MS = 1.5s après le clic

    const doRevealBlocks = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      document.body.classList.add('revealed');
    };

    const doScrollToInvitation = () => {
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 320);
    };

    const animateIntro = (from: number, to: number, onComplete?: () => void) => {
      introPlayingRef.current = true;
      const start = performance.now();
      let blocksRevealed = false;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / INTRO_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        // Pendant l'intro, on force current = target (pas de lerp)
        const v = from + (to - from) * eased;
        targetIdxRef.current = v;
        currentIdxRef.current = v;
        // Déclenche l'apparition du faire-part à 60 % de l'intro
        if (t >= REVEAL_TRIGGER_RATIO && !blocksRevealed) {
          blocksRevealed = true;
          doRevealBlocks();
        }
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          introPlayingRef.current = false;
          onComplete?.();
        }
      };
      requestAnimationFrame(step);
    };

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (revealedRef.current) return;
      document.querySelector('.hero')?.classList.add('fading-out');
      animateIntro(1, INTRO_END_IDX, doScrollToInvitation);
      setTimeout(() => {
        if (!revealedRef.current) {
          doRevealBlocks();
          doScrollToInvitation();
        }
      }, INTRO_DURATION_MS + 3000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

    // ── Scroll → target frame index ─────────────────────────────────
    const onScroll = () => {
      if (!revealedRef.current) return;
      const block1 = document.getElementById('invitation');
      const lastBlock = document.querySelector('.rsvp');
      if (!block1 || !lastBlock) return;

      const startY = (block1 as HTMLElement).offsetTop - window.innerHeight * 0.6;
      const endY =
        (lastBlock as HTMLElement).offsetTop +
        (lastBlock as HTMLElement).offsetHeight -
        window.innerHeight * 0.4;
      const range = Math.max(1, endY - startY);
      const progress = Math.min(1, Math.max(0, (window.scrollY - startY) / range));
      targetIdxRef.current = INTRO_END_IDX + progress * (TOTAL - INTRO_END_IDX);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      revealBtn?.removeEventListener('click', onRevealClick);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div className="bg-video" aria-hidden="true">
        <img
          ref={layerRef}
          src={frameSrc(1)}
          alt=""
          className="bg-frame"
          decoding="sync"
          data-idx="1"
        />
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
