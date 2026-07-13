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

const DEBUT_TOTAL = 893;
const FIN_TOTAL = 1786;
// Skip les 1.5 premières secondes de « fin » : fin extraite à 180 fps interpolate,
// donc 1.5 s = 270 frames.
const FIN_START_FRAME = 270;
// Lecture en 3 phases avec ramp d'accélération lisse.
// À 90 fps d'extraction, 1× native = 0.09 fpms display.
//   Phase 1a (0 → 1.65 s)  : PHASE A constante (2× native = 0.18 fpms)
//                            → couvre source 0 → 3.3 s (frames 1 → 298)
//   Phase 1b (1.65 → 1.95 s): RAMP linéaire 2× → 6× native (300 ms)
//                            → couvre source 3.3 → 4.5 s (frames 298 → 406)
//   Phase 2  (1.95 s → fin) : PHASE B constante (6× native = 0.54 fpms)
//                            → démarre PILE à source 4.5 s (frame 405)
const NATIVE_FPMS = 0.18;       // 2× native (2 × 90 fps extract)
const PEAK_FPMS = 0.54;         // 6× native (6 × 90 fps extract)
const PHASE_1A_END_MS = 1650;
const RAMP_MS = 300;
const PHASE_1B_END_MS = PHASE_1A_END_MS + RAMP_MS; // 1950
const FRAME_AT_1A_END = 1 + NATIVE_FPMS * PHASE_1A_END_MS;
const FRAME_AT_1B_END = FRAME_AT_1A_END + ((NATIVE_FPMS + PEAK_FPMS) * RAMP_MS) / 2;
const PHASE_2_DURATION_MS = Math.round((1191 - FRAME_AT_1B_END) / PEAK_FPMS);
const DEBUT_DURATION_MS = PHASE_1B_END_MS + PHASE_2_DURATION_MS;
const SCROLL_LERP = 0.16;
// Aligne la durée du crossfade debut→fin sur celle du glissement du bloc
// faire-part (transition CSS transform 3.4 s). Les deux animations démarrent
// au même instant et finissent au même instant — perçues comme une seule
// respiration visuelle.
const CROSSFADE_MS = 3400;

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
  // Devient true quand toutes les frames de « début » sont décodées.
  // « fin » peut se charger en arrière-plan pendant que l'utilisateur regarde
  // le début — inutile de bloquer le clic dessus.
  const debutReadyRef = useRef(false);
  // Si l'utilisateur clique AVANT que debut soit prêt, on garde le clic en
  // attente et on démarre l'intro dès que le préchargement est terminé.
  const pendingIntroRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Fonction qui démarre l'intro — définie plus bas, référencée ici via
    // closure. Le préchargement l'appelle si un clic est en attente.
    let startIntro: (() => void) | null = null;

    (async () => {
      // 1) Priorité : préchargement + décodage complet de « début ».
      for (let i = 1; i <= DEBUT_TOTAL; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = debutFrame(i);
        try { await im.decode(); } catch { /* silent */ }
      }
      debutReadyRef.current = true;
      document.body.classList.remove('loading');
      // Si l'utilisateur a cliqué en attendant, on démarre maintenant.
      if (pendingIntroRef.current) {
        pendingIntroRef.current = false;
        startIntro?.();
      }
      // 2) « fin » ensuite, en tâche de fond — pas de blocage sur son chargement.
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

    const activateFinLayer = () => {
      phaseRef.current = 'fin';
      currentIdxRef.current = FIN_START_FRAME;
      targetIdxRef.current = FIN_START_FRAME;
      if (finLayerRef.current) {
        finLayerRef.current.src = finFrame(FIN_START_FRAME);
        finLayerRef.current.dataset.idx = `fin-${FIN_START_FRAME}`;
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
      // La séquence « fin » prend le relais immédiatement — plus de
      // délai. Crossfade doux debut → fin déclenché maintenant.
      activateFinLayer();
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
        if (elapsed < PHASE_1A_END_MS) {
          // Phase 1a : vitesse native constante
          v = 1 + NATIVE_FPMS * elapsed;
        } else if (elapsed < PHASE_1B_END_MS) {
          // Phase 1b : ramp d'accélération linéaire de la vitesse
          // v_start = NATIVE_FPMS, v_end = PEAK_FPMS
          // Intégrale : f(t) = f_start + v_start × t + (v_end − v_start) × t² / (2 × T)
          const t = elapsed - PHASE_1A_END_MS;
          v =
            FRAME_AT_1A_END +
            NATIVE_FPMS * t +
            ((PEAK_FPMS - NATIVE_FPMS) * t * t) / (2 * RAMP_MS);
        } else if (elapsed < DEBUT_DURATION_MS) {
          // Phase 2 : vitesse pic constante 6× native
          const t = elapsed - PHASE_1B_END_MS;
          v = FRAME_AT_1B_END + PEAK_FPMS * t;
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

    // Fonction extraite : démarre l'intro (fade hero, animateDebut, filet
     // de sécurité). Appelée soit au clic si tout est prêt, soit à la fin
     // du préchargement si l'utilisateur avait cliqué en avance.
    startIntro = () => {
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

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (revealedRef.current || pendingIntroRef.current) return;

      if (debutReadyRef.current) {
        // Frames prêtes → démarre tout de suite.
        startIntro?.();
      } else {
        // Pas encore prêt → affiche l'indicateur de chargement et
        // retiendra le clic. Le préchargement lancera startIntro dès qu'il
        // aura terminé debut.
        document.body.classList.add('loading');
        pendingIntroRef.current = true;
      }
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
      targetIdxRef.current = FIN_START_FRAME + progress * (FIN_TOTAL - FIN_START_FRAME);
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
