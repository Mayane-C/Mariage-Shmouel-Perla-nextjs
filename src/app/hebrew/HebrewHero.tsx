import { content } from '@/lib/content';

export function HebrewHero() {
  return (
    <section className="hero hebrew-hero" dir="rtl">
      <div className="hero-inner">
        <div className="bsd hebrew">{content.bsd}</div>
        <img
          className="hero-logo"
          src={content.images.weddingLogo}
          alt="שמואל ופערלה"
        />
        <div className="hebrew-names names hebrew-hero-names">
          שמואל <span className="script-amp" aria-hidden="true">&amp;</span> פערלה
        </div>
        <h1 className="names hebrew-hero-latin">
          Shmouel <span className="script-amp" aria-hidden="true">&amp;</span> Perla
        </h1>
        <p className="hebrew-hero-date">{content.dateHebrew}</p>
        <p className="hebrew-hero-date-fr">{content.dateGrégorienne}</p>
      </div>
      <div className="hero-cta">
        <a
          className="btn btn-hero"
          href="#invitation"
          aria-label="לצפייה בהזמנה"
          dir="rtl"
        >
          לצפייה בהזמנה
        </a>
      </div>
      <div className="hero-loading hebrew" aria-hidden="true">
        טוען את ההזמנה<span>…</span>
      </div>
    </section>
  );
}
