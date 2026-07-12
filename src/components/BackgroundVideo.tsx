'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par DEUX séquences de frames JPG (« début » puis
 * « fin »), avec crossfade doux à la bascule pour que la transition ne se
 * voit pas.
 *
 * Rendu : deux <img> superposés (debut / fin), chacun avec sa propre src
 * pilotée par sa phase. À la bascule, on fait fondre le layer sortant
 * (opacité 1 → 0) pendant que l'entrant apparaît (0 → 1) sur ~800 ms.
 */

const DEBUT_TOTAL = 1191;
const FIN_TOTAL = 2381;
const NATIVE_END_FRAME = 360;    // frame à 3 s natives (3 s × 120 fps interp)
const NATIVE_PHASE_MS = 3000;    // phase native (0 → 3 s, linéaire)
const ACCEL_PHASE_MS = 2000;     // phase accélérée (3 → 5 s, ease-in doux et continu)
const DEBUT_DURATION_MS = NATIVE_PHASE_MS + ACCEL_PHASE_MS;
const SCROLL_LERP = 0.16;
const CROSSFADE_MS = 800;

const debutFrame = (i: number) =>
  `/frames/debut/frame-${String(Math.max(1, Math.min(DEBUT_TOTAL, i))).padStart(4, '0')}.jpg`;

const finFrame = (i: number) =>
  `/frames/fin/frame-${String(Math.max(1, Math.min(FIN_TOTAL, i))).padStart(4, '0')}.jpg`;

export function BackgroundVideo() {
  const debutLayerRef = useRef<HTMLImageElement>(null);
  const finLayerRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);
  const revealedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const scrollBaselineYRef = useRef(0);
  const phaseRef = useRef<'debut' | 'fin'>('debut');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= DEBUT_TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = debutFrame(i);
        try { await im.decode(); } catch { /* silent */ }
      }
      for (let i = 1; i <= FIN_TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = finFrame(i);
        try { await im.decode(); } catch { /* silent */ }
      }
    })();

    // Helper : mute la src du layer correspondant à la phase courante.
    const setFrameSrc = (frameIdx: number) => {
      const el = phaseRef.current === 'debut' ? debutLayerRef.current : finLayerRef.current;
      const key = `${phaseRef.current}-${frameIdx}`;
      if (el && el.dataset.idx !== key) {
        el.src = phaseRef.current === 'debut' ? debutFrame(frameIdx) : finFrame(frameIdx);
        el.dataset.idx = key;
      }
    };

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

    // Délai avant que la séquence « fin » ne prenne le relais (le layer
     // debut reste figé sur sa dernière frame pendant ce temps).
    const FIN_START_DELAY_MS = 1000;

    const activateFinLayer = () => {
      phaseRef.current = 'fin';
      currentIdxRef.current = 1;
      targetIdxRef.current = 1;
      if (finLayerRef.current) {
        finLayerRef.current.src = finFrame(1);
        finLayerRef.current.dataset.idx = 'fin-1';
      }
      finLayerRef.current?.classList.add('is-active');
      debutLayerRef.current?.classList.remove('is-active');
      // Après stabilisation du crossfade + auto-scroll, activation du scrub.
      setTimeout(() => {
        scrollBaselineYRef.current = window.scrollY;
        scrubActiveRef.current = true;
      }, 1500);
    };

    const doRevealBlocks = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      document.body.classList.add('revealed');
      // La séquence « fin » démarre FIN_START_DELAY_MS après l'apparition
      // du bloc. Le layer debut reste visible (dernière frame figée)
      // pendant ce délai, avant le crossfade doux vers fin.
      setTimeout(activateFinLayer, FIN_START_DELAY_MS);
    };

    const doScrollToInvitation = () => {
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    };

    const animateDebut = (onComplete?: () => void) => {
      introPlayingRef.current = true;
      phaseRef.current = 'debut';
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        let v: number;
        if (elapsed < NATIVE_PHASE_MS) {
          // Phase 1 : native, linéaire de la frame 1 → NATIVE_END_FRAME.
          const t = elapsed / NATIVE_PHASE_MS;
          v = 1 + (NATIVE_END_FRAME - 1) * t;
        } else if (elapsed < DEBUT_DURATION_MS) {
          // Phase 2 : ease-in doux et continu — commence à la même vitesse
          // que la fin de la phase 1 (120 fps display, continuité) puis
          // accélère progressivement jusqu'à la dernière frame.
          //
          // Formule : f(t) = 0.3 t + 0.7 t²
          //   f(0) = 0, f'(0) = 0.3 (vitesse initiale relative)
          //   f(1) = 1, f'(1) = 1.7 (vitesse finale, ~5.7× plus rapide)
          // Vitesse à t=0 : 0.3 × (span/duration) ≈ 125 fps (matche phase 1)
          // Vitesse à t=1 : 1.7 × (span/duration) ≈ 706 fps (fast-forward final)
          const t = (elapsed - NATIVE_PHASE_MS) / ACCEL_PHASE_MS;
          const eased = 0.3 * t + 0.7 * t * t;
          v = NATIVE_END_FRAME + (DEBUT_TOTAL - NATIVE_END_FRAME) * eased;
        } else {
          v = DEBUT_TOTAL;
        }
        targetIdxRef.current = v;
        currentIdxRef.current = v;
        const clamped = Math.max(1, Math.min(DEBUT_TOTAL, Math.round(v)));
        setFrameSrc(clamped);
        if (elapsed < DEBUT_DURATION_MS) {
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
      document.body.classList.add('hero-out');
      document.querySelector('.hero')?.classList.add('fading-out');

      animateDebut(() => {
        doRevealBlocks();
        doScrollToInvitation();
      });

      setTimeout(() => {
        if (!revealedRef.current) {
          doRevealBlocks();
          doScrollToInvitation();
        }
      }, DEBUT_DURATION_MS + 3000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

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
      <div className="bg-video" aria-hidden="true" style={{ ['--crossfade-ms' as string]: `${CROSSFADE_MS}ms` }}>
        <img
          ref={debutLayerRef}
          src={debutFrame(1)}
          alt=""
          className="bg-frame bg-frame-debut is-active"
          decoding="sync"
          data-idx="debut-1"
        />
        <img
          ref={finLayerRef}
          src={finFrame(1)}
          alt=""
          className="bg-frame bg-frame-fin"
          decoding="sync"
          data-idx="fin-1"
        />
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
