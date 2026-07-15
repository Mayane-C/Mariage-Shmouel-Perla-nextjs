'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { content } from '@/lib/content';
import { HebrewArc } from './HebrewArc';
import { Ornament } from './Ornament';

/**
 * Faire-part hébreu — duplicata RTL du FairePart français, affiché
 * juste en dessous. Même animation spring sur mobile, même reveal
 * class .invitation-formal (transition-delay 0s → apparaît en même
 * temps que le faire-part français).
 */
export function FairePartHebrew() {
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

  const useSpring = isMobile && !prefersReducedMotion;

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
      className="invitation-formal block block-arch hebrew-faire-part"
      dir="rtl"
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

      <div className="families-formal hebrew">
        <span className="fam">משפחת סמדג׳ה</span>
        <span className="amp">&amp;</span>
        <span className="fam">משפחת שוקרון</span>
      </div>

      <p className="preamble hebrew-preamble">
        שמחים להזמינכם
        <br />
        לחגוג עמנו בשמחת נישואי ילדינו
      </p>

      <div className="names-formal hebrew-names-block">
        שמואל <span className="script-amp-sm" aria-hidden="true">&amp;</span> פערלה
      </div>
      <div className="hebrew-names-formal names-formal-latin">
        Shmouel &amp; Perla
      </div>

      <div className="memorial-divider" aria-hidden="true" />
      <p className="memorial hebrew">
        לזכר סבינו ״פאפי יוסף״ ו״ממי אירן״,
        <br />
        ובמיוחד לזכר אבינו היקר
        <br />
        <strong>אריק סמדג׳ה ז״ל</strong>
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
