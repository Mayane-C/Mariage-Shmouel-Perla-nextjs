'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond d'écran orchestré par DEUX séquences de frames JPG (« début » puis
 * « fin »), avec crossfade permanent frame-à-frame façon BM Chmouel.
 *
 * Rendu = 2 <img> superposés A/B :
 *  - A garde toujours la frame précédente (opacity 1 fixe)
 *  - B reçoit la nouvelle frame (opacity 0 → 1 sur ~250 ms)
 *  → Le « flip » discret d'un cut-to-cut est remplacé par un morph
 *    permanent qui donne la sensation de motion blur, comme BM Chmouel.
 *
 * Bascule debut→fin : même mécanisme, mais avec un crossfade long
 * (1600 ms) aligné sur la transition CSS du bloc faire-part.
 *
 * Philosophie playback (identique à BM) : PAS de fast-forward.
 * On sous-échantillonne les 596 JPGs sur disque pour n'en afficher que
 * 240 espacées régulièrement, jouées linéairement sur 4 s → exactement
 * 1 frame par tick d'écran 60 Hz, aucun saut = fluidité maximale.
 */

// JPGs physiques sur disque (extraction ffmpeg)
const DEBUT_SRC_TOTAL = 596;
const FIN_TOTAL = 1191;
// Sous-ensemble affiché : 240 frames espacées, comme BM (240 frames / 4 s)
const DEBUT_DISPLAY_COUNT = 240;
// Skip les 1.5 premières secondes de « fin » : fin extraite à 120 fps interpolate.
const FIN_START_FRAME = 180;

// Durée de l'intro : 4 s = 240 rAF ticks = exactement 1 frame par tick.
const INTRO_DURATION_MS = 4000;
const REVEAL_LEAD_MS = 200; // Reveal bloc 200 ms avant la fin

const SCROLL_LERP = 0.16;

// Crossfade frame-à-frame comme BM (crossfade += 0.06/rAF ≈ 278 ms)
const FRAME_CROSSFADE_MS = 260;
// Crossfade long pour la bascule debut→fin, aligné sur le glissement du bloc.
const PHASE_CROSSFADE_MS = 1600;

// Traduit un index d'affichage (1..DEBUT_DISPLAY_COUNT) en index de source
// (1..DEBUT_SRC_TOTAL), espacement linéaire.
const debutSrcIdxFromDisplay = (displayIdx: number) => {
  const clamped = Math.max(1, Math.min(DEBUT_DISPLAY_COUNT, Math.round(displayIdx)));
  return Math.max(
    1,
    Math.min(
      DEBUT_SRC_TOTAL,
      Math.round(1 + ((clamped - 1) / (DEBUT_DISPLAY_COUNT - 1)) * (DEBUT_SRC_TOTAL - 1))
    )
  );
};

const debutFrame = (displayIdx: number) =>
  `/frames/debut/frame-${String(debutSrcIdxFromDisplay(displayIdx)).padStart(4, '0')}.jpg`;

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

    // Précharge décodé : uniquement les 240 frames debut affichées (pas les
    // 596 sur disque). Le décodage GPU se fait sur ce qu'on va vraiment
    // montrer, économie de mémoire et de temps.
    (async () => {
      const debutPrewarm: string[] = [];
      for (let i = 1; i <= DEBUT_DISPLAY_COUNT; i++) debutPrewarm.push(debutFrame(i));
      const finPrewarm: string[] = [];
      for (let i = FIN_START_FRAME; i <= FIN_TOTAL; i += Math.round(FIN_TOTAL / 8)) {
        finPrewarm.push(finFrame(i));
      }
      const criticalSrcs = [...debutPrewarm, ...finPrewarm];
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

    // En tâche de fond : télécharge aussi les JPGs entre-deux (au cas où
    // scrub/re-play plus tard), sans bloquer.
    kickoffPreload(DEBUT_SRC_TOTAL, (i) =>
      `/frames/debut/frame-${String(i).padStart(4, '0')}.jpg`
    );
    kickoffPreload(FIN_TOTAL, finFrame);

    // === Ping-pong A/B état local ===
    let lastA = debutFrame(1);
    let lastB = debutFrame(1);
    let crossfade = 1;
    let currentCrossfadeMs = FRAME_CROSSFADE_MS;
    let prevRafTs = 0;

    const computeTargetSrc = () => {
      if (phaseRef.current === 'debut') {
        return debutFrame(currentIdxRef.current);
      }
      const idx = Math.max(1, Math.min(FIN_TOTAL, Math.round(currentIdxRef.current)));
      return finFrame(idx);
    };

    let rafId = 0;
    const tick = (now: number) => {
      if (!introPlayingRef.current) {
        const diff = targetIdxRef.current - currentIdxRef.current;
        if (Math.abs(diff) > 0.05) {
          currentIdxRef.current += diff * SCROLL_LERP;
        }
      }

      const targetSrc = computeTargetSrc();
      if (targetSrc !== lastB) {
        const wasDebutOnB = lastB.includes('/debut/');
        const willBeDebut = targetSrc.includes('/debut/');
        currentCrossfadeMs =
          wasDebutOnB !== willBeDebut ? PHASE_CROSSFADE_MS : FRAME_CROSSFADE_MS;

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
        // Linéaire : 240 frames sur 4 000 ms → 0.06 fpms display = 1× native.
        // Chaque rAF (16 ms) avance de ~0.96 index → 1 frame nouvelle
        // affichée par tick d'écran, aucun saut.
        const p = Math.min(1, elapsed / INTRO_DURATION_MS);
        const displayIdx = 1 + p * (DEBUT_DISPLAY_COUNT - 1);
        currentIdxRef.current = displayIdx;
        targetIdxRef.current = displayIdx;
        if (!revealFired && elapsed >= INTRO_DURATION_MS - REVEAL_LEAD_MS) {
          revealFired = true;
          onReveal?.();
        }
        if (elapsed < INTRO_DURATION_MS) {
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
      }, INTRO_DURATION_MS + 3000);
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
