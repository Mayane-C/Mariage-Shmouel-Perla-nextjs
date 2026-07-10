import { content } from '@/lib/content';

/**
 * Phrase hébraïque courbe en SVG textPath — קול ששון וקול שמחה.
 */
export function HebrewArc() {
  return (
    <svg
      className="arc-wrap"
      viewBox="0 0 560 150"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={content.kolSasson}
    >
      <defs>
        {/* Path inversé (droite → gauche) pour que l'hébreu se lise
            dans le bon sens, et arc adouci (Q y = 20 au lieu de -30)
            pour un dôme moins prononcé. */}
        <path id="arc-path" d="M 540 138 Q 280 20 20 138" fill="none" />
      </defs>
      <text
        fontFamily="'FrankRuhlLibre','Frank Ruhl Libre','Frank Ruehl','David',serif"
        fontSize="36"
        fontWeight="700"
        fill="#A88962"
        letterSpacing="0.5"
        direction="rtl"
      >
        <textPath href="#arc-path" startOffset="50%" textAnchor="middle">
          {content.kolSasson}
        </textPath>
      </text>
    </svg>
  );
}
