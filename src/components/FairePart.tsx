import { content } from '@/lib/content';
import { HebrewArc } from './HebrewArc';
import { Ornament } from './Ornament';

export function FairePart() {
  return (
    <section id="invitation" className="invitation-formal block block-arch">
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

      <svg className="ornament" viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="0" y1="10" x2="46" y2="10" stroke="currentColor" strokeWidth="0.7" />
        <circle cx="60" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.7" />
        <line x1="74" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="0.7" />
      </svg>

      <div className="families-formal">
        <span className="fam">{content.familles.marie}</span>
        <span className="amp">&amp;</span>
        <span className="fam">{content.familles.mariee}</span>
      </div>

      <p className="preamble script-preamble">
        Ont l&apos;immense joie de vous faire part
        <br />
        du mariage de leurs enfants
      </p>

      <div className="names-formal">
        {content.maries.prenomLatin}{' '}
        <img
          className="rings-amp rings-amp-sm"
          src={content.images.rings}
          alt="et"
          aria-hidden="true"
        />{' '}
        {content.maries.conjointe}
      </div>
      <div className="hebrew-names-formal">{content.maries.prenomHebrew}</div>

      <div className="memorial-divider" aria-hidden="true" />
      <p className="memorial">
        {content.memorial.intro}
        <br />
        {content.memorial.highlight}
        <br />
        <strong>
          {content.memorial.nom} <span className="hebrew">{content.memorial.suffixe}</span>
        </strong>
      </p>
    </section>
  );
}
