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
          <img className="rings-amp" src={content.images.rings} alt="et" aria-hidden="true" />{' '}
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
