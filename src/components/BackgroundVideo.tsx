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

const DEBUT_TOTAL = 596;
const FIN_TOTAL = 1191;
// Skip les 1.5 premières secondes de « fin » : fin extraite à 120 fps interpolate,
// donc 1.5 s = 180 frames.
const FIN_START_FRAME = 180;
// Lecture en 3 phases avec ramp d'accélération lisse.
// À 60 fps d'extraction, 1× native = 0.06 fpms display.
//   Phase 1a (0 → 1.65 s)  : PHASE A constante (2× native = 0.12 fpms)
//                            → couvre source 0 → 3.3 s (frames 1 → 199)
//   Phase 1b (1.65 → 1.95 s): RAMP linéaire 2× → 6× native (300 ms)
//                            → couvre source 3.3 → 4.5 s (frames 199 → 271)
//   Phase 2  (1.95 s → fin) : PHASE B constante (6× native = 0.36 fpms)
//                            → démarre PILE à source 4.5 s (frame 270)
const NATIVE_FPMS = 0.12;       // 2× native (2 × 60 fps extract)
const PEAK_FPMS = 0.36;         // 6× native (6 × 60 fps extract)
const PHASE_1A_END_MS = 1650;
const RAMP_MS = 300;
const PHASE_1B_END_MS = PHASE_1A_END_MS + RAMP_MS; // 1950
const FRAME_AT_1A_END = 1 + NATIVE_FPMS * PHASE_1A_END_MS;
const FRAME_AT_1B_END = FRAME_AT_1A_END + ((NATIVE_FPMS + PEAK_FPMS) * RAMP_MS) / 2;
// Cut 0.2 s en fin de vidéo debut — on arrête l'anim 200 ms avant que la
// dernière frame naturelle soit atteinte, pour éviter la traîne de fin.
const DEBUT_TAIL_CUT_MS = 200;
const PHASE_2_DURATION_MS =
  Math.round((DEBUT_TOTAL - FRAME_AT_1B_END) / PEAK_FPMS) - DEBUT_TAIL_CUT_MS;
const DEBUT_DURATION_MS = PHASE_1B_END_MS + PHASE_2_DURATION_MS;
const SCROLL_LERP = 0.16;
// Aligne la durée du crossfade debut→fin sur celle du glissement du bloc
// faire-part (transition CSS transform 1.6 s). Les deux animations démarrent
// au même instant et finissent au même instant — perçues comme une seule
// respiration visuelle.
const CROSSFADE_MS = 1600;

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
    // Fonction qui démarre l'intro — assignée plus bas dans ce useEffect.
    // Initialisée en no-op pour que le préchargement puisse l'appeler
    // sans risque si un clic arrive avant.
    let startIntro: () => void = () => {};

    // Préchargement style BM Chmouel : feu-et-oublie, sans await im.decode().
    // Le navigateur télécharge en tâche de fond à son propre rythme.
    const kickoffPreload = (count: number, frameFn: (i: number) => string) => {
      for (let i = 1; i <= count; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = frameFn(i);
      }
    };

    // Frames CRITIQUES à décoder explicitement AVANT de signaler prêt :
    //   · debut frame 1 : première image visible du hero
    //   · fin frame FIN_START_FRAME : première image affichée après le
    //     crossfade debut→fin, sinon flash blanc pendant la bascule
    // Ces 2 décodages sont rapides (2 promesses en parallèle) et fiabilisent
    // le moment critique où le bloc apparaît en même temps que le crossfade.
    (async () => {
      const criticalSrcs = [debutFrame(1), finFrame(FIN_START_FRAME)];
      await Promise.all(
        criticalSrcs.map(async (src) => {
          const im = new Image();
          im.src = src;
          try {
            await im.decode();
          } catch {
            /* silent */
          }
        })
      );
      if (cancelled) return;
      debutReadyRef.current = true;
      document.body.classList.remove('loading');
      if (pendingIntroRef.current) {
        pendingIntroRef.current = false;
        startIntro();
      }
    })();

    // En parallèle, lance TOUS les fetches en tâche de fond sans décoder —
    // le navigateur les récupère et les met en cache, prêts à l'affichage.
    kickoffPreload(DEBUT_TOTAL, debutFrame);
    kickoffPreload(FIN_TOTAL, finFrame);

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

    // Révèle uniquement le bloc + auto-scroll (pas le crossfade fin).
    // Le crossfade vers « fin » est déclenché séparément, au vrai END de
    // l'animation debut, pour ne pas gâcher le fast-forward phase B qui
    // continue à jouer pendant que le bloc glisse.
    //
    // Isolation de la mutation classList dans un rAF dédié + lecture de
    // offsetHeight du bloc AVANT le class change. Ces 2 mesures garantissent
    // que le browser enregistre l'état initial (opacity 0, translateY 340px)
    // et met en place la transition CSS proprement avant que la classe soit
    // ajoutée. Sans ça, le browser peut « sauter » la transition parce que
    // la mutation arrive dans le même frame que le rAF précédent.
    const doRevealBlocks = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      const block = document.querySelector<HTMLElement>('.invitation-formal');
      if (block) void block.offsetHeight;
      requestAnimationFrame(() => {
        document.body.classList.add('revealed');
      });
    };

    const doScrollToInvitation = () => {
      // Scroll immédiat via requestAnimationFrame — la transition CSS du
      // bloc et le scroll partent au même moment, l'utilisateur voit le
      // bloc glisser dès qu'il entre dans le viewport (pas de temps mort).
      requestAnimationFrame(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    };

    const animateDebut = (
      onReveal?: () => void,
      onComplete?: () => void
    ) => {
      introPlayingRef.current = true;
      phaseRef.current = 'debut';
      const start = performance.now();
      let revealFired = false;
      const step = (now: number) => {
        const elapsed = now - start;
        let v: number;
        if (elapsed < PHASE_1A_END_MS) {
          v = 1 + NATIVE_FPMS * elapsed;
        } else if (elapsed < PHASE_1B_END_MS) {
          const t = elapsed - PHASE_1A_END_MS;
          v =
            FRAME_AT_1A_END +
            NATIVE_FPMS * t +
            ((PEAK_FPMS - NATIVE_FPMS) * t * t) / (2 * RAMP_MS);
        } else if (elapsed < DEBUT_DURATION_MS) {
          const t = elapsed - PHASE_1B_END_MS;
          v = FRAME_AT_1B_END + PEAK_FPMS * t;
        } else {
          v = DEBUT_TOTAL;
        }
        targetIdxRef.current = v;
        currentIdxRef.current = v;
        const clamped = Math.max(1, Math.min(DEBUT_TOTAL, Math.round(v)));
        setFrameSrc(clamped);
        // Reveal 0.2 s AVANT la fin de la vidéo debut — le bloc glisse
        // juste avant que le crossfade vers fin ne démarre, apparition
        // synchronisée sans temps mort perçu.
        if (!revealFired && elapsed >= DEBUT_DURATION_MS - 200) {
          revealFired = true;
          onReveal?.();
        }
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

      animateDebut(
        // onReveal : fin du ramp (t=1.95 s wall) — bloc glisse en parallèle
        // du fast-forward final de la vidéo debut, pas de temps mort.
        () => {
          doRevealBlocks();
          doScrollToInvitation();
        },
        // onComplete : vrai END de debut (t=2.85 s wall) — crossfade
        // debut → fin. La vidéo « fin » prend le relais.
        () => {
          activateFinLayer();
        }
      );

      setTimeout(() => {
        if (!revealedRef.current) {
          doRevealBlocks();
          doScrollToInvitation();
          activateFinLayer();
        }
      }, DEBUT_DURATION_MS + 3000);
    };

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (revealedRef.current || pendingIntroRef.current) return;

      if (debutReadyRef.current) {
        // Frames prêtes → démarre tout de suite.
        startIntro();
      } else {
        // Pas encore prêt → affiche l'indicateur de chargement et
        // retiendra le clic. Le préchargement lancera startIntro dès qu'il
        // aura terminé debut.
        document.body.classList.add('loading');
        pendingIntroRef.current = true;
        // Filet de sécurité : si le chargement traîne > 2 s (réseau lent,
        // appareil serré), on démarre quand même — mieux vaut un léger
        // saccade au début que faire attendre l'utilisateur indéfiniment.
        setTimeout(() => {
          if (pendingIntroRef.current) {
            pendingIntroRef.current = false;
            document.body.classList.remove('loading');
            startIntro();
          }
        }, 2000);
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
