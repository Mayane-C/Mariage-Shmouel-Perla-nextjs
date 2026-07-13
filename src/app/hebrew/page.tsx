import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { Ornament } from '@/components/Ornament';
import { HebrewArc } from '@/components/HebrewArc';
import { HebrewRsvp } from './HebrewRsvp';

export const metadata: Metadata = {
  title: 'הזמנה לחתונה — שמואל ופערלה',
  description: 'הזמנה לחתונת שמואל ופערלה · יום ה׳ 3 בספטמבר 2026 · באוביני',
};

export default function HebrewInvitation() {
  return (
    <div className="hebrew-page" dir="rtl">
      <header className="site-header scrolled hebrew-header">
        <nav className="site-nav">
          <a href="/" className="brand hebrew" aria-label="חזרה לגרסה הצרפתית">
            שמואל ופערלה
          </a>
          <a href="/" className="hebrew-back-link">
            Version française →
          </a>
        </nav>
      </header>

      <div className="page hebrew-content">
        {/* Faire-part hébreu */}
        <section id="invitation-he" className="invitation-formal block block-arch">
          <Ornament n={1} className="block-ornament-accent bl" />
          <Ornament n={2} className="block-ornament tr" />
          <Ornament n={3} className="block-ornament-2 tr" />

          <HebrewArc />

          <img
            className="faire-part-logo"
            src={content.images.weddingLogo}
            alt=""
            aria-hidden="true"
          />

          <div className="fp-divider" aria-hidden="true">
            <span className="fp-divider-line" />
            <img className="fp-divider-rings" src={content.images.rings} alt="" />
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
          <div className="hebrew-names-formal names-formal-latin">Shmouel &amp; Perla</div>

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
        </section>

        {/* Save the Date hébreu */}
        <section id="details-he" className="details block">
          <Ornament n={4} className="block-ornament tr" />
          <Ornament n={5} className="block-ornament-accent bl" />

          <p className="script-label hebrew-label">שמרו את התאריך</p>
          <h2 className="script-heading">Save the Date</h2>

          <div className="date-he-large">{content.dateHebrew}</div>
          <div className="date-fr">{content.dateGrégorienne}</div>

          <div className="schedule">
            <div className="schedule-row">
              <span className="schedule-label">קבלת פנים</span>
              <span className="schedule-time">{content.horaires.kabalatPanim}</span>
            </div>
            <div className="schedule-row">
              <span className="schedule-label">חופה</span>
              <span className="schedule-time">{content.horaires.houppa}</span>
            </div>
          </div>

          <div className="venue">
            <p className="venue-name">{content.lieu.nom}</p>
            <p className="venue-address">{content.lieu.adresse}</p>
            <a
              className="btn btn-primary"
              href={content.lieu.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              ניווט לאולם
            </a>
          </div>

          <p className="note">הטקס יסתיים בקבלת פנים חגיגית</p>
        </section>

        {/* Bracha hébreu */}
        <section id="bracha-he" className="bracha block">
          <Ornament n={6} className="block-ornament tr" />
          <Ornament n={7} className="block-ornament-accent bl" />

          <h2 className="script-heading">Mazal Tov</h2>

          <div className="bracha hebrew-blessing">
            {content.bracha.hebrewLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>

        {/* RSVP hébreu */}
        <HebrewRsvp />
      </div>

      <footer className="site-footer hebrew-footer">
        <p className="hebrew">שמואל ופערלה · 3 בספטמבר 2026</p>
        <p className="ltd-line">
          <a href={content.ltd.whatsapp} target="_blank" rel="noreferrer">
            {content.ltd.label}
          </a>
        </p>
        <p className="ltd-rights">{content.ltd.rights}</p>
      </footer>
    </div>
  );
}
