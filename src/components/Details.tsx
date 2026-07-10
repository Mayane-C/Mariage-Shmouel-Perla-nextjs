import { content } from '@/lib/content';
import { Ornament } from './Ornament';

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

export function Details() {
  return (
    <section className="details block">
      <Ornament n={3} className="block-ornament-corner tr" />
      <Ornament n={3} className="block-ornament-accent tr" />
      <Ornament n={6} className="block-ornament bl" />
      <Ornament n={4} className="block-ornament-2 bl" />

      <h2 className="script-heading">Save the Date</h2>
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
    </section>
  );
}
