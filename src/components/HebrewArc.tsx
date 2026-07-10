import { content } from '@/lib/content';

/**
 * Phrase hébraïque courbe en SVG textPath — chaîne inversée pour
 * compenser l'absence de reordering RTL le long d'un path.
 */
const arcText = Array.from(content.kolSasson).reverse().join('');

export function HebrewArc() {
  return (
    <svg
      className="arc-wrap"
      viewBox="0 0 560 190"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={content.kolSasson}
    >
      <defs>
        <path id="arc-path" d="M 30 178 Q 280 -30 530 178" fill="none" />
      </defs>
      <text
        fontFamily="'FrankRuhlLibre','Frank Ruhl Libre','Frank Ruehl','David',serif"
        fontSize="36"
        fontWeight="700"
        fill="#A88962"
        letterSpacing="0.5"
      >
        <textPath href="#arc-path" startOffset="50%" textAnchor="middle">
          {arcText}
        </textPath>
      </text>
    </svg>
  );
}
