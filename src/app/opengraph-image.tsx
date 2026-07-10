import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

// Génère l'OG image au moment du build (compatible output: 'export').
export const dynamic = 'force-static';

export const alt =
  'Invitation — Mariage de Shmouel & Perla · Jeudi 3 septembre 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  // Assets locaux embarqués dans l'image (base64).
  const logoPath = path.join(process.cwd(), 'public/images/wedding-logo.png');
  const ringsPath = path.join(process.cwd(), 'public/images/rings.png');
  const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  const ringsBase64 = `data:image/png;base64,${fs.readFileSync(ringsPath).toString('base64')}`;

  // Palette Sable Chaud (nude)
  const cream = '#FAF7F1';
  const gold = '#B8935F';
  const goldDeep = '#8A6E4A';
  const taupe = '#4A3F35';
  const sand = '#C9A87D';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: cream,
          fontFamily: 'Georgia, serif',
          color: taupe,
          position: 'relative',
        }}
      >
        {/* Double filet doré en haut */}
        <div
          style={{
            position: 'absolute',
            top: 26,
            left: 60,
            right: 60,
            height: 1,
            background: gold,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 33,
            left: 60,
            right: 60,
            height: 1,
            background: gold,
          }}
        />
        {/* Double filet doré en bas */}
        <div
          style={{
            position: 'absolute',
            bottom: 26,
            left: 60,
            right: 60,
            height: 1,
            background: gold,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 33,
            left: 60,
            right: 60,
            height: 1,
            background: gold,
          }}
        />

        {/* Monogramme ש-פ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt=""
          width={140}
          height={140}
          style={{ marginBottom: 18 }}
        />

        {/* INVITATION en petites caps */}
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            color: gold,
            marginBottom: 18,
          }}
        >
          Invitation
        </div>

        {/* MARIAGE */}
        <div
          style={{
            fontSize: 46,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: taupe,
            fontWeight: 400,
            marginBottom: 24,
          }}
        >
          Mariage
        </div>

        {/* Shmouel [rings] Perla */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            fontSize: 78,
            fontStyle: 'italic',
            color: goldDeep,
            marginBottom: 16,
            fontFamily: 'Georgia, serif',
          }}
        >
          <span>Shmouel</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ringsBase64} alt="et" width={72} height={44} />
          <span>Perla</span>
        </div>

        {/* Noms hébreux avec & doré au milieu — chaque mot est inversé
            (Satori n'a pas de bidi), et flexDirection row-reverse place
            Shmouel à droite / Perla à gauche pour une lecture RTL correcte. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'baseline',
            gap: 20,
            fontSize: 34,
            color: sand,
            letterSpacing: '0.04em',
            marginBottom: 26,
          }}
        >
          <span>{Array.from('שמואל').reverse().join('')}</span>
          <span
            style={{
              color: gold,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              fontSize: 42,
              lineHeight: 1,
            }}
          >
            &amp;
          </span>
          <span>{Array.from('פרלה').reverse().join('')}</span>
        </div>

        {/* Date en italique */}
        <div
          style={{
            fontSize: 28,
            fontStyle: 'italic',
            color: taupe,
            opacity: 0.85,
          }}
        >
          Jeudi 3 septembre 2026 · Bobigny
        </div>
      </div>
    ),
    { ...size }
  );
}
