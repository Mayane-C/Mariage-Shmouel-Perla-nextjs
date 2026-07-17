'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { content } from '@/lib/content';
import { HebrewArc } from './HebrewArc';
import { Ornament } from './Ornament';

/**
 * Faire-part avec animation d'apparition en spring — pattern BM Chmouel.
 * Mobile (≤ 720 px) : contrôlé par framer-motion, initial y=600 → 0
 * avec spring stiffness 48 / damping 13 / mass 1.1 (identique BM).
 * Desktop : garde le comportement CSS existant (le motion.section n'ajoute
 * pas d'inline style — c'est le CSS body:not(.revealed) .block qui gère
 * l'état initial et la transition).
 */
export function FairePart() {
  const [isMobile, setIsMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (document.body.classList.contains('revealed')) {
      setRevealed(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('revealed')) {
        setRevealed(true);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Framer-motion désactivé : le CSS pilote entièrement le reveal.
  // Desktop → glissement translateY(340px) + fade (transition 1.6 s ease-out).
  // Mobile  → fade-only (via la media query qui neutralise le transform)
  //           → évite que le bloc, hors viewport en bas, ne soit visible
  //           pendant qu'il glisse depuis encore plus bas.
  const useSpring = false;
  // Références conservées pour ne pas casser le typage : isMobile et
  // prefersReducedMotion sont détectés mais non utilisés côté animation.
  void isMobile;
  void prefersReducedMotion;

  const springVariants = {
    hidden: { opacity: 0, y: 600 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 40,
        damping: 12,
        mass: 1,
        opacity: { duration: 1, ease: 'easeOut' as const },
      },
    },
  };

  return (
    <motion.section
      id="invitation"
      className="invitation-formal block block-arch"
      // Sur mobile, on force la classe .mobile-spring pour que le CSS
      // n'applique ni son opacity 0 initial ni sa transition — framer-motion
      // prend la main.
      data-spring={useSpring ? 'on' : 'off'}
      initial={useSpring ? 'hidden' : undefined}
      animate={useSpring ? (revealed ? 'visible' : 'hidden') : undefined}
      variants={useSpring ? springVariants : undefined}
    >
      <Ornament n={1} className="block-ornament-accent bl" />
      <Ornament n={2} className="block-ornament tr" />
      <Ornament n={3} className="block-ornament-2 tr" />
      <Ornament n={4} className="block-ornament-3 tr-a" />
      <Ornament n={5} className="block-ornament-3 tr-b" />

      <HebrewArc />

      <img
        className="faire-part-logo"
        src={content.images.weddingLogo}
        alt=""
        aria-hidden="true"
      />

      <div className="fp-divider" aria-hidden="true">
        <span className="fp-divider-line" />
        <img
          className="fp-divider-rings"
          src={content.images.rings}
          alt=""
        />
        <span className="fp-divider-line" />
      </div>

      <div className="families-formal">
        <div className="fam-side">
          {content.familles.marie.map((nom) => (
            <p key={nom} className="fam">{nom}</p>
          ))}
        </div>
        <div className="fam-side">
          {content.familles.mariee.map((nom) => (
            <p key={nom} className="fam">{nom}</p>
          ))}
        </div>
      </div>

      <p className="preamble script-preamble">
        Remercient Hachem de vous faire part
        <br />
        du mariage de leurs enfants et petits-enfants
      </p>

      <div className="names-formal">
        {content.maries.prenomLatin}{' '}
        <span className="script-amp script-amp-sm" aria-hidden="true">&amp;</span>{' '}
        {content.maries.conjointe}
      </div>
      <div className="hebrew-names-formal">{content.maries.prenomHebrew}</div>

      <p className="preamble script-preamble fp-post-names">
        et seront honorés de votre présence à la houppa b&quot;h
      </p>

      <div className="date-fr">{content.dateGrégorienne}</div>
      <div className="date-he">{content.dateHebrew}</div>

      <div className="times">
        <div className="time-item">
          <ClockIcon />
          <div className="time-label">Kabalat Panim</div>
          <div className="time-value">{content.horaires.kabalatPanim}</div>
        </div>
        <div className="time-item">
          <ClockIcon />
          <div className="time-label">Houppa</div>
          <div className="time-value">{content.horaires.houppa}</div>
        </div>
      </div>

      <div className="venue">
        <PinIcon />
        <p className="label">Lieu</p>
        <div className="venue-name">{content.lieu.nom}</div>
        <div className="venue-address">{content.lieu.adresse}</div>
        <a className="btn" href={content.lieu.mapsUrl} target="_blank" rel="noopener">
          Itinéraire
        </a>
      </div>

      <p className="note">La cérémonie sera suivie d&apos;une réception</p>

      <div className="memorial-divider" aria-hidden="true" />
      <p className="memorial">
        {content.memorial.intro}
        <br />
        {content.memorial.highlight}
        <br />
        <strong>
          {content.memorial.nom} <span className="hebrew">{content.memorial.suffixe}</span>
        </strong>
        <span
          className="memorial-dove"
          aria-hidden="true"
          style={{
            maskImage: `url(${content.images.colombe})`,
            WebkitMaskImage: `url(${content.images.colombe})`,
          }}
        />
      </p>
    </motion.section>
  );
}

function ClockIcon() {
  return (
    <svg
      className="detail-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="12,6.5 12,12 15.5,14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className="detail-icon detail-icon-lg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21.5 C 12 21.5 4.5 14.5 4.5 9.5 A 7.5 7.5 0 0 1 19.5 9.5 C 19.5 14.5 12 21.5 12 21.5 Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </svg>
  );
}
