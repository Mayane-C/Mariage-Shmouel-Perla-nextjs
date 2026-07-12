import { content } from '@/lib/content';
import { Countdown } from './Countdown';

export function Hero() {
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
          <span className="script-amp" aria-hidden="true">&amp;</span>{' '}
          {content.maries.conjointe}
        </h1>
        <div className="hebrew-names">
          שמואל <span className="amp">&amp;</span> פערלה
        </div>
        <Countdown />
      </div>
      <a className="btn btn-hero" href="#invitation" aria-label="Voir l'invitation">
        Voir l&apos;invitation
      </a>
    </section>
  );
}
