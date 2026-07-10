'use client';

import { content } from '@/lib/content';
import { Countdown } from './Countdown';

export function Hero() {
  const handleReveal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!document.body.classList.contains('revealed')) {
      document.body.classList.add('revealed');
    }
    requestAnimationFrame(() => {
      document
        .getElementById('invitation')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="bsd hebrew">{content.bsd}</div>
        <img
          className="hero-logo"
          src={content.images.weddingLogo}
          alt="Monogramme Shmouel & Perla"
        />
        <h1 className="names">
          {content.maries.prenomLatin}{' '}
          <img className="rings-amp" src={content.images.rings} alt="et" aria-hidden="true" />{' '}
          {content.maries.conjointe}
        </h1>
        <div className="hebrew-names">
          שמואל <span className="amp">&amp;</span> פרלה
        </div>
        <Countdown />
      </div>
      <a
        className="btn btn-hero"
        href="#invitation"
        aria-label="Voir l'invitation"
        onClick={handleReveal}
      >
        Voir l&apos;invitation
      </a>
    </section>
  );
}
