'use client';

import { useEffect, useRef } from 'react';
import { content } from '@/lib/content';

/**
 * Vidéo de fond scrubbée (position: fixed) — pilotée d'abord par une animation
 * JS au clic sur "Voir l'invitation", puis par le scroll après reveal.
 */
export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const introEndTimeRef = useRef(14); // recalculé à partir de la durée

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const safeSetTime = (t: number) => {
      try {
        v.currentTime = Math.max(0, Math.min(v.duration || 0, t));
      } catch {
        /* noop */
      }
    };

    const applyDuration = () => {
      if (v.duration && !isNaN(v.duration)) {
        introEndTimeRef.current = v.duration * 0.65;
      }
    };
    if (v.readyState >= 1 || v.duration > 0) applyDuration();
    v.addEventListener('loadedmetadata', applyDuration);
    v.addEventListener('loadeddata', () => safeSetTime(0));
    v.pause();
    safeSetTime(0);

    // ─── Reveal — animation currentTime + slide du faire-part ─────
    const doRevealAndScroll = () => {
      document.body.classList.add('revealed');
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 320);
    };

    const animateIntro = (from: number, to: number, durationMs: number, done?: () => void) => {
      const start = performance.now();
      const run = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        safeSetTime(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(run);
        else done?.();
      };
      requestAnimationFrame(run);
    };

    const revealBtn = document.querySelector<HTMLElement>('.btn-hero');
    const onRevealClick = (e: Event) => {
      e.preventDefault();
      if (document.body.classList.contains('revealed')) return;
      if (!v.duration || v.networkState === 3) {
        doRevealAndScroll();
        return;
      }
      document.querySelector('.hero')?.classList.add('fading-out');
      animateIntro(0, introEndTimeRef.current, 2500, doRevealAndScroll);
      setTimeout(() => {
        if (!document.body.classList.contains('revealed')) doRevealAndScroll();
      }, 6000);
    };
    revealBtn?.addEventListener('click', onRevealClick);

    // ─── Scroll → currentTime (après reveal) ──────────────────────
    let ticking = false;
    const onScroll = () => {
      if (!v.duration || !document.body.classList.contains('revealed')) return;
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

        const target = introEndTimeRef.current + progress * (v.duration - introEndTimeRef.current);
        const lerped = v.currentTime + (target - v.currentTime) * 0.3;
        safeSetTime(lerped);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      revealBtn?.removeEventListener('click', onRevealClick);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div className="bg-video" id="bgVideo" aria-hidden="true">
        <video ref={videoRef} id="bgVideoEl" muted playsInline preload="auto" tabIndex={-1}>
          <source src={content.images.video} type="video/mp4" />
        </video>
      </div>
      <div className="bg-veil" aria-hidden="true" />
    </>
  );
}
