import { content } from '@/lib/content';

export function Footer() {
  return (
    <footer>
      <a
        className="ltd-link"
        href={content.ltd.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter La Touche Designer sur WhatsApp (nouvel onglet)"
      >
        <img className="ltd-logo" src={content.images.ltdLogo} alt="La Touche Designer" />
        <span className="ltd-cta">
          {content.ltd.label}
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 L17 7" />
            <path d="M8 7 H17 V16" />
          </svg>
        </span>
        <span className="ltd-phone">{content.ltd.tel}</span>
      </a>
      <p className="ltd-rights">{content.ltd.rights}</p>
    </footer>
  );
}
