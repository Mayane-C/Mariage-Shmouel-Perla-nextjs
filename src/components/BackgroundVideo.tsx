'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par DEUX séquences de frames JPG (« début » puis
 * « fin »), avec crossfade permanent frame-à-frame façon BM Chmouel.
 *
 * Rendu = 2 <img> superposés A/B :
 *  - A garde toujours la frame précédente (opacity 1 fixe)
 *  - B reçoit la nouvelle frame (opacity 0 → 1 sur ~80 ms)
 *  → Le « flip » discret d'un cut-to-cut est remplacé par un morph
 *    permanent qui donne la sensation de motion blur, comme BM Chmouel.
 *
 *  Bascule debut→fin : même mécanisme, mais avec un crossfade long
 *  (1600 ms) aligné sur la transition CSS du bloc faire-part.
 */

const DEBUT_TOTAL = 596;
const FIN_TOTAL = 1191;
// Skip les 1.5 premières secondes de « fin » : fin extraite à 120 fps interpolate,
// donc 1.5 s = 180 frames.
const FIN_START_FRAME = 180;
// Lecture en 3 phases avec ramp d'accélération lisse.
// À 60 fps d'extraction, 1× native = 0.06 fpms display.
const NATIVE_FPMS = 0.12;       // 2× native (2 × 60 fps extract = 120 fps display)
const PEAK_FPMS = 0.18;         // 3× native (3 × 60 fps = 180 fps display)
const PHASE_1A_END_MS = 1650;
const RAMP_MS = 300;
const PHASE_1B_END_MS = PHASE_1A_END_MS + RAMP_MS; // 1950
const FRAME_AT_1A_END = 1 + NATIVE_FPMS * PHASE_1A_END_MS;
const FRAME_AT_1B_END = FRAME_AT_1A_END + ((NATIVE_FPMS + PEAK_FPMS) * RAMP_MS) / 2;
const DEBUT_TAIL_CUT_MS = 200;
const PHASE_2_DURATION_MS =
  Math.round((DEBUT_TOTAL - FRAME_AT_1B_END) / PEAK_FPMS) - DEBUT_TAIL_CUT_MS;
const DEBUT_DURATION_MS = PHASE_1B_END_MS + PHASE_2_DURATION_MS;
const SCROLL_LERP = 0.16;

// Crossfade frame-à-frame : court pour lisser le passage, sans figer.
// À 60 Hz rAF, dt ≈ 16 ms → opacity B s'incrémente de ~20 % / rAF.
// Puisqu'une nouvelle frame arrive à chaque rAF pendant la phase 2 (fast-forward),
// B tourne autour de 20-40 % en permanence : A (frame précédente) domine
// visuellement mais B (nouvelle) est toujours partiellement présente
// → effet motion blur qui gomme le « cut » discret.
const FRAME_CROSSFADE_MS = 80;
// Crossfade long pour la bascule debut→fin, aligné sur la transition
// CSS du bloc faire-part (transform 1.6 s).
const PHASE_CROSSFADE_MS = 1600;

const debutFrame = (i: number) =>
  `/frames/debut/frame-${String(Math.max(1, Math.min(DEBUT_TOTAL, i))).padStart(4, '0')}.jpg`;

const finFrame = (i: number) =>
  `/frames/fin/frame-${String(Math.max(1, Math.min(FIN_TOTAL, i))).padStart(4, '0')}.jpg`;

export function BackgroundVideo() {
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const currentIdxRef = useRef(1);
  const targetIdxRef = useRef(1);
  const revealedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const scrollBaselineYRef = useRef(0);
  const phaseRef = useRef<'debut' | 'fin'>('debut');
  const debutReadyRef = useRef(false);
  const pendingIntroRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let startIntro: () => void = () => {};

    const kickoffPreload = (count: number, frameFn: (i: number) => string) => {
      for (let i = 1; i <= count; i++) {
        if (cancelled) return;
        const im = new Image();
        im.src = frameFn(i);
      }
    };

    (async () => {
      const debutPrewarm: number[] = [];
      for (let i = 1; i <= DEBUT_TOTAL; i += 30) debutPrewarm.push(i);
      if (debutPrewarm[debutPrewarm.length - 1] !== DEBUT_TOTAL) {
        debutPrewarm.push(DEBUT_TOTAL);
      }
      const finPrewarm: number[] = [];
      for (let i = FIN_START_FRAME; i <= FIN_TOTAL; i += Math.round(FIN_TOTAL / 8)) {
        finPrewarm.push(i);
      }
      const criticalSrcs = [
        ...debutPrewarm.map((i) => debutFrame(i)),
        ...finPrewarm.map((i) => finFrame(i)),
      ];
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

    kickoffPreload(DEBUT_TOTAL, debutFrame);
    kickoffPreload(FIN_TOTAL, finFrame);

    // === Ping-pong A/B état local ===
    // A : frame précédente (opacity 1 fixe, sous B dans le DOM)
    // B : frame courante (opacity 0 → 1, fade-in au-dessus de A)
    // Quand une nouvelle frame arrive : A hérite de ce qui était sur B,
    // B charge la nouvelle → crossfade repart à 0.
    let lastA = debutFrame(1);
    let lastB = debutFrame(1);
    let crossfade = 1;
    let currentCrossfadeMs = FRAME_CROSSFADE_MS;
    let prevRafTs = 0;

    const computeTargetSrc = () => {
      const total = phaseRef.current === 'debut' ? DEBUT_TOTAL : FIN_TOTAL;
      const frameFn = phaseRef.current === 'debut' ? debutFrame : finFrame;
      const idx = Math.max(1, Math.min(total, Math.round(currentIdxRef.current)));
      return frameFn(idx);
    };

    let rafId = 0;
    const tick = (now: number) => {
      // 1) Interpolation du scrub (uniquement hors intro — intro pilote
      //    directement currentIdxRef pour un rendu déterministe).
      if (!introPlayingRef.current) {
        const diff = targetIdxRef.current - currentIdxRef.current;
        if (Math.abs(diff) > 0.05) {
          currentIdxRef.current += diff * SCROLL_LERP;
        }
      }

      // 2) Ping-pong si la frame cible a changé.
      const targetSrc = computeTargetSrc();
      if (targetSrc !== lastB) {
        const wasDebutOnB = lastB.includes('/debut/');
        const willBeDebut = targetSrc.includes('/debut/');
        // Détection bascule debut↔fin : crossfade long (1.6 s) au lieu du
        // frame-à-frame court (80 ms) — aligné sur le glissement du bloc.
        currentCrossfadeMs =
          wasDebutOnB !== willBeDebut ? PHASE_CROSSFADE_MS : FRAME_CROSSFADE_MS;

        // A hérite de la frame courante de B (celle qui vient de vivre
        // son fade-in complet, donc affichée), B accueille la nouvelle.
        if (layerARef.current && lastA !== lastB) {
          layerARef.current.setAttribute('src', lastB);
          lastA = lastB;
        }
        if (layerBRef.current) {
          layerBRef.current.setAttribute('src', targetSrc);
        }
        lastB = targetSrc;
        crossfade = 0;
      }

      // 3) Avancement du crossfade en fonction du dt réel du rAF.
      if (crossfade < 1) {
        const dt = prevRafTs === 0 ? 16 : now - prevRafTs;
        crossfade = Math.min(1, crossfade + dt / currentCrossfadeMs);
        if (layerBRef.current) {
          layerBRef.current.style.opacity = String(crossfade);
        }
      }
      prevRafTs = now;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const activateFinLayer = () => {
      // Simple bascule d'état : au prochain tick, computeTargetSrc renvoie
      // une frame « fin », le ping-pong déclenche automatiquement un
      // crossfade long (PHASE_CROSSFADE_MS) grâce à la détection debut↔fin.
      phaseRef.current = 'fin';
      currentIdxRef.current = FIN_START_FRAME;
      targetIdxRef.current = FIN_START_FRAME;
      setTimeout(() => {
        scrollBaselineYRef.current = window.scrollY;
        scrubActiveRef.current = true;
      }, 1500);
    };

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
        // Uniquement mettre à jour l'idx — le rAF tick s'occupe du DOM
        // (crossfade A/B en continu).
        currentIdxRef.current = v;
        targetIdxRef.current = v;
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

    startIntro = () => {
      document.body.classList.add('hero-out');
      document.querySelector('.hero')?.classList.add('fading-out');

      animateDebut(
        () => {
          doRevealBlocks();
          doScrollToInvitation();
        },
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
        startIntro();
      } else {
        document.body.classList.add('loading');
        pendingIntroRef.current = true;
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
      <div className="bg-video" aria-hidden="true">
        <img
          ref={layerARef}
          src={debutFrame(1)}
          alt=""
          className="bg-frame bg-frame-a"
          decoding="sync"
        />
        <img
          ref={layerBRef}
          src={debutFrame(1)}
          alt=""
          className="bg-frame bg-frame-b"
          decoding="sync"
          style={{ opacity: 1 }}
        />
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
