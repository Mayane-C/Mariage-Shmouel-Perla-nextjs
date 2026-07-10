'use client';

import { useEffect, useState } from 'react';
import { content } from '@/lib/content';

/**
 * Phrase hébraïque en dôme — pattern importé du BM Chmouel (Announcement.tsx).
 *
 * Pourquoi cette approche plutôt que <textPath> ?
 *   → SVG <textPath> tourne chaque glyphe selon le tangent du path. Sur un
 *     path dans l'un OU l'autre sens, on obtient soit des lettres qui se
 *     lisent LTR (inversion de l'ordre pour l'hébreu), soit des lettres
 *     retournées tête-en-bas. Les deux options échouent pour l'hébreu.
 *
 *   Solution : on positionne chaque grapheme (lettre + nikoud si présents)
 *   sur un cercle avec ses propres coordonnées x,y et son rotation. Le
 *   glyphe 0 va à droite (départ pour un lecteur hébreu), le dernier à
 *   gauche, chaque glyphe est rotaté pour rester "debout" perpendiculaire
 *   au rayon → lecture RTL naturelle sans aucune inversion.
 */

// Splitting en graphèmes (lettre + points de vocalisation) via Intl.Segmenter
// pour un support correct du nikoud. Fallback simple si le navigateur n'a pas
// Intl.Segmenter (rare aujourd'hui).
function getGraphemes(text: string): string[] {
  try {
    const seg = new Intl.Segmenter('he', { granularity: 'grapheme' });
    return [...seg.segment(text)].map((g) => g.segment);
  } catch {
    return [...text];
  }
}

// Géométrie du dôme
const VIEW_W = 900;
const VIEW_H = 180;
const CX = 450;
const CY = 900;   // centre du cercle sous l'arc (dôme très doux)
const R = 850;    // rayon large = arc très plat
const STEP_DEG = 5.2; // pas angulaire entre chaque lettre
const FONT_SIZE = 44;

export function HebrewArc() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const graphemes = getGraphemes(content.kolSasson);
  const N = graphemes.length;
  const totalDeg = (N - 1) * STEP_DEG;

  return (
    <svg
      className="arc-wrap"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={content.kolSasson}
    >
      {mounted &&
        graphemes.map((g, i) => {
          // i=0 → à droite (première lettre pour un lecteur hébreu)
          // i=N-1 → à gauche (dernière lettre)
          // Centre du dôme = -90° (12 h). On répartit symétriquement.
          const angleDeg = -90 + totalDeg / 2 - i * STEP_DEG;
          const rad = (angleDeg * Math.PI) / 180;
          const x = CX + R * Math.cos(rad);
          const y = CY + R * Math.sin(rad);
          // Rotation de chaque glyphe pour rester perpendiculaire au rayon
          const rotDeg = angleDeg + 90;
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill="#A88962"
              fontSize={FONT_SIZE}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontFamily: "'FrankRuhlLibre','Frank Ruhl Libre','Frank Ruehl','David',serif" }}
              transform={`rotate(${rotDeg} ${x} ${y})`}
            >
              {g}
            </text>
          );
        })}
    </svg>
  );
}
