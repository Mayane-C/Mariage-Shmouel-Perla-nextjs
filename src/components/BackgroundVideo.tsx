'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par DEUX séquences de frames JPG :
 *
 *   1. « début » — joue automatiquement au clic sur « Voir l'invitation »
 *      via animateDebut. À sa dernière frame, doRevealBlocks() déclenche
 *      le glissement du bloc faire-part.
 *
 *   2. « fin » — pilotée par le scroll utilisateur après l'apparition du
 *      bloc. Frame 1 = début du scroll (juste après le baseline
 *      d'auto-scroll), frame N = bas du bloc RSVP.
 *
 * Chaque séquence a son propre nombre de frames (déterminé par
 * l'extraction ffmpeg). Le composant garde une frame courante et
 * bascule entre les deux images sources selon la phase.
 */

const DEBUT_TOTAL = 596;         // frames extraites de debut.mp4 (60 fps minterpolate)
const FIN_TOTAL = 596;           // frames extraites de fin.mp4 (60 fps minterpolate)
const DEBUT_DURATION_MS = 10000; // 10 s réelles pour jouer « début » à vitesse native
                                 // (10 s vidéo native → 10 s réelles → 59.6 fps display).
const SCROLL_LERP = 0.10;        // interpolation par frame pendant le scroll — plus petit = plus doux

const debutFrame = (i: number) =>
  `/frames/debut/frame-${String(Math.max(1, Math.min(DEBUT_TOTAL, i))).padStart(3, '0')}.jpg`;

const finFrame = (i: number) =>
  `/frames/fin/frame-${String(Math.max(1, Math.min(FIN_TOTAL, i))).padStart(3, '0')}.jpg`;

export function BackgroundVideo() {
  const layerRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);
  const revealedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const scrubActiveRef = useRef(false);          // scroll-scrub actif ? (activé après stabilisation de l'auto-scroll)
  const scrollBaselineYRef = useRef(0);          // scrollY au moment où le scrub s'active
  const phaseRef = useRef<'debut' | 'fin'>('debut'); // séquence courante affichée

  useEffect(() => {
    // ── Préchargement + décodage de toutes les frames des DEUX vidéos ──
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= DEBUT_TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = debutFrame(i);
        try { await im.decode(); } catch { /* fallback silencieux */ }
      }
      for (let i = 1; i <= FIN_TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = finFrame(i);
        try { await im.decode(); } catch { /* fallback silencieux */ }
      }
    })();

    // Helper : mute src selon la phase courante.
    const setFrameSrc = (frameIdx: number) => {
      const src = phaseRef.current === 'debut' ? debutFrame(frameIdx) : finFrame(frameIdx);
      const key = `${phaseRef.current}-${frameIdx}`;
      if (layerRef.current && layerRef.current.dataset.idx !== key) {
        layerRef.current.src = src;
        layerRef.current.dataset.idx = key;
      }
    };

    // ── Boucle rAF pour le scroll-scrub (uniquement pendant phase « fin ») ──
    let rafId = 0;
    const tick = () => {
      if (!introPlayingRef.current) {
        const diff = targetIdxRef.current - currentIdxRef.current;
        if (Math.abs(diff) > 0.05) {
          currentIdxRef.current += diff * SCROLL_LERP;
          const total = phaseRef.current === 'debut' ? DEBUT_TOTAL : FIN_TOTAL;
          const clamped = Math.max(1, Math.min(total, Math.round(currentIdxRef.current)));
          setFrameSrc(clamped);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // ── Utilitaires ───────────────────────────────────────────────────
    const doRevealBlocks = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      document.body.classList.add('revealed');
      // Attendre la stabilisation de l'auto-scroll avant d'activer le
      // scroll-scrub. Sinon les events scroll générés par
      // doScrollToInvitation feraient avancer la vidéo prématurément.
      setTimeout(() => {
        scrollBaselineYRef.current = window.scrollY;
        // Passage à la séquence « fin » — frame 1 comme point de départ.
        phaseRef.current = 'fin';
        currentIdxRef.current = 1;
        targetIdxRef.current = 1;
        setFrameSrc(1);
        scrubActiveRef.current = true;
      }, 1500);
    };

    const doScrollToInvitation = () => {
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    };

    /**
     * Anime la séquence « début » de la frame `from` à `to` en `duration` ms,
     * linéaire (aucune décélération). Met à jour layerRef.src à chaque tick.
     */
    const animateDebut = (from: number, to: number, duration: number, onComplete?: () => void) => {
      introPlayingRef.current = true;
      phaseRef.current = 'debut';
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const v = from + (to - from) * t;
        targetIdxRef.current = v;
        currentIdxRef.current = v;
        const clamped = Math.max(1, Math.min(DEBUT_TOTAL, Math.round(v)));
        setFrameSrc(clamped);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          introPlayingRef.current = false;
          onComplete?.();
        }
      };
      requestAnimationFrame(step);
    };

    // ── Clic sur « Voir l'invitation » ────────────────────────────────
    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (revealedRef.current) return;
      // L'overlay sombre se retire immédiatement, en même temps que le hero
      // s'estompe. .revealed n'est ajouté qu'à la fin de « début » pour
      // déclencher le glissement du bloc.
      document.body.classList.add('hero-out');
      document.querySelector('.hero')?.classList.add('fading-out');

      // Joue « début » du début à la fin en DEBUT_DURATION_MS. À la fin,
      // le bloc apparaît et la séquence bascule sur « fin » (scroll-scrub).
      animateDebut(1, DEBUT_TOTAL, DEBUT_DURATION_MS, () => {
        doRevealBlocks();
        doScrollToInvitation();
      });

      // Filet de sécurité : si l'anim plante, on révèle quand même.
      setTimeout(() => {
        if (!revealedRef.current) {
          doRevealBlocks();
          doScrollToInvitation();
        }
      }, DEBUT_DURATION_MS + 3000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

    // ── Scroll → target frame index dans la séquence « fin » ─────────
    const onScroll = () => {
      if (!scrubActiveRef.current || introPlayingRef.current) return;
      const lastBlock = document.querySelector('.rsvp');
      if (!lastBlock) return;

      const delta = window.scrollY - scrollBaselineYRef.current;
      if (delta <= 0) {
        targetIdxRef.current = 1;
        return;
      }

      const endY =
        (lastBlock as HTMLElement).offsetTop +
        (lastBlock as HTMLElement).offsetHeight -
        window.innerHeight * 0.4;
      const endDelta = Math.max(1, endY - scrollBaselineYRef.current);
      const progress = Math.min(1, delta / endDelta);
      targetIdxRef.current = 1 + progress * (FIN_TOTAL - 1);
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
          src={debutFrame(1)}
          alt=""
          className="bg-frame"
          decoding="sync"
          data-idx="debut-1"
        />
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
