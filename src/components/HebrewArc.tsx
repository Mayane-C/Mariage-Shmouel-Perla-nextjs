import { content } from '@/lib/content';

/**
 * Phrase hébraïque courbe en SVG textPath.
 *
 * Astuce : la chaîne est inversée (dernière lettre → première) pour que
 * la lecture visuelle (de droite à gauche le long de l'arc) donne la
 * phrase dans le bon sens pour un lecteur hébreu.
 */
const reversedText = Array.from(content.kolSasson).reverse().join('');

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
        <path id="arc-path" d="M 20 138 Q 280 20 540 138" fill="none" />
      </defs>
      <text
        fontFamily="'FrankRuhlLibre','Frank Ruhl Libre','Frank Ruehl','David',serif"
        fontSize="36"
        fontWeight="700"
        fill="#A88962"
        letterSpacing="0.5"
      >
        <textPath href="#arc-path" startOffset="50%" textAnchor="middle">
          {reversedText}
        </textPath>
      </text>
    </svg>
  );
}
