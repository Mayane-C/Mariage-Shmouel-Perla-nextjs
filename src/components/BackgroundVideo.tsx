'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par séquence de frames JPG (pattern BM Chmouel),
 * décomposé en deux phases distinctes :
 *
 *   Phase A — intro accélérée (frame 1 → PAUSE_A_FRAME) en INTRO_A_MS.
 *     Joue automatiquement au clic sur « Voir l'invitation ».
 *
 *   Phase B — continuation à la même cadence (PAUSE_A_FRAME → PAUSE_B_FRAME)
 *     en INTRO_B_MS, déclenchée à la fin de la phase A, en même temps que
 *     le glissement CSS du bloc faire-part (translateY 340 → 0). La vidéo
 *     avance donc « comme un scroll » pendant que le bloc monte, puis se
 *     fige quand le bloc est en place.
 *
 *   Après phase B — le scroll pilote la fin de la vidéo (PAUSE_B_FRAME → TOTAL)
 *     au fur et à mesure que l'utilisateur descend dans les blocs suivants.
 */

const TOTAL = 632;               // frames extraites après -ss 1 (skip 1re s)
const PAUSE_A_FRAME = 300;       // frame à t=10s après trim — fin phase A (3.3s × 90 fps)
const PAUSE_B_FRAME = 606;       // frame à t=20.2s après trim — fin phase B, vidéo se fige
const INTRO_A_MS = 3300;         // durée réelle phase A (300 frames en 3.3s ≈ 90 fps = 3× native)
                                 // Bloc apparaît à la fin — vidéo défile en continu jusque-là.
const INTRO_B_MS = 3400;         // durée phase B strictement calée sur la transition CSS 3.4s
                                 // du glissement du bloc — vidéo se fige EXACTEMENT à la fin du
                                 // glissement (306 frames en 3.4s = 3× native).

const SCROLL_LERP = 0.10;        // interpolation par frame pendant le scroll — plus petit = plus doux

const frameSrc = (i: number) =>
  `/frames/frame-${String(Math.max(1, Math.min(TOTAL, i))).padStart(3, '0')}.jpg`;

export function BackgroundVideo() {
  const layerRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);
  const revealedRef = useRef(false);
  const introPlayingRef = useRef(false);

  useEffect(() => {
    // ── Préchargement + décodage de toutes les frames ─────────────────
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = frameSrc(i);
        try {
          await im.decode();
        } catch {
          /* fallback silencieux */
        }
      }
    })();

    // ── Boucle rAF pour le scroll-scrub (après phase B) ───────────────
    let rafId = 0;
    const tick = () => {
      if (!introPlayingRef.current) {
        const diff = targetIdxRef.current - currentIdxRef.current;
        if (Math.abs(diff) > 0.05) {
          currentIdxRef.current += diff * SCROLL_LERP;
          const clamped = Math.max(1, Math.min(TOTAL, Math.round(currentIdxRef.current)));
          if (layerRef.current && layerRef.current.dataset.idx !== String(clamped)) {
            layerRef.current.src = frameSrc(clamped);
            layerRef.current.dataset.idx = String(clamped);
          }
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
    };

    const doScrollToInvitation = () => {
      // Retard un peu plus grand : la transition CSS du bloc a le temps
      // de démarrer avant que le scroll ne bouge le viewport. Réduit les
      // chances que la transition soit court-circuitée par le layout re-flow
      // (surtout sensible en mobile Safari).
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    };

    /**
     * Anime un segment [from, to] de frames en `duration` ms, avec easing
     * cubic-out. Met à jour directement layerRef.src à chaque tick (pas de
     * lerp — la boucle tick est écartée par introPlayingRef).
     */
    const animateSegment = (
      from: number,
      to: number,
      duration: number,
      onComplete?: () => void
    ) => {
      introPlayingRef.current = true;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Easing linéaire : vitesse constante, pas de décélération en fin de phase.
        const v = from + (to - from) * t;
        targetIdxRef.current = v;
        currentIdxRef.current = v;
        const clamped = Math.max(1, Math.min(TOTAL, Math.round(v)));
        if (layerRef.current && layerRef.current.dataset.idx !== String(clamped)) {
          layerRef.current.src = frameSrc(clamped);
          layerRef.current.dataset.idx = String(clamped);
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

    // ── Clic sur « Voir l'invitation » : enchaîne phase A → phase B ───
    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (revealedRef.current) return;
      // L'overlay sombre se retire immédiatement, en même temps que le hero
      // s'estompe. .revealed n'est ajouté qu'à la fin de la phase A pour
      // déclencher le glissement des blocs.
      document.body.classList.add('hero-out');
      document.querySelector('.hero')?.classList.add('fading-out');

      // Phase A : frames 1 → 337 en 5 s (intro accélérée 2.25× native).
      // Aucun freeze intermédiaire — la vidéo enchaîne directement sur
      // phase B au moment où le bloc apparaît.
      animateSegment(1, PAUSE_A_FRAME, INTRO_A_MS, () => {
        // Révèle les blocs (déclenche la transition CSS 3.4s du glissement
        // translateY 340 → 0 sur .block/footer) et lance le scroll auto
        // vers #invitation pour voir le glissement en direct.
        doRevealBlocks();
        doScrollToInvitation();
        // Phase B : la vidéo continue à la même cadence pendant le
        // glissement du bloc — se fige à PAUSE_B_FRAME quand le bloc
        // arrive en position.
        animateSegment(PAUSE_A_FRAME, PAUSE_B_FRAME, INTRO_B_MS);
      });

      // Filet de sécurité : si l'anim plante pour une raison ou une autre,
      // on révèle quand même les blocs après le total des deux phases + 3s.
      setTimeout(() => {
        if (!revealedRef.current) {
          doRevealBlocks();
          doScrollToInvitation();
        }
      }, INTRO_A_MS + INTRO_B_MS + 3000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

    // ── Scroll → target frame index (après phase B) ───────────────────
    const onScroll = () => {
      if (!revealedRef.current || introPlayingRef.current) return;
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
      targetIdxRef.current = PAUSE_B_FRAME + progress * (TOTAL - PAUSE_B_FRAME);
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
