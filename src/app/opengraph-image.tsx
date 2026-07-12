import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

// Génère l'OG image au moment du build (compatible output: 'export').
export const dynamic = 'force-static';

export const alt =
  'Invitation — Mariage de Shmouel & Perla · Jeudi 3 septembre 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Récupère un fichier de police depuis Google Fonts au moment du build.
 * Playfair Display sert de substitut à Didot (Didot n'est pas OFL/libre) —
 * même famille Didone, mêmes proportions élégantes.
 */
async function fetchGoogleFont(
  family: string,
  opts: { weight?: number; italic?: boolean } = {}
): Promise<ArrayBuffer> {
  const { weight = 400, italic = false } = opts;
  const params = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    '+'
  )}:${params}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      // UA moderne pour obtenir du woff2 (supporté par Satori v0.4+).
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format/);
  if (!match) throw new Error(`Font URL not found for ${family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OG() {
  // Fonts : Playfair Display (substitut Didot, Didone élégant) + FrankRuhlLibre
  // pour l'hébreu (identique au site).
  const [playfairRegular, playfairItalic, playfairBold] = await Promise.all([
    fetchGoogleFont('Playfair Display', { weight: 500 }),
    fetchGoogleFont('Playfair Display', { weight: 400, italic: true }),
    fetchGoogleFont('Playfair Display', { weight: 700 }),
  ]);

  const logoPath = path.join(process.cwd(), 'public/images/wedding-logo.png');
  const frankPath = path.join(
    process.cwd(),
    'public/fonts/FrankRuhlLibre-Regular.ttf'
  );
  const logoBase64 = `data:image/png;base64,${fs
    .readFileSync(logoPath)
    .toString('base64')}`;
  const frankFont = fs.readFileSync(frankPath);

  // Palette Sable Chaud (cohérente avec le site).
  const cream = '#FAF7F1';
  const gold = '#B8935F';
  const sandDeep = '#A88962';
  const bronze = '#7A5A2C';
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
          fontFamily: 'Playfair',
          color: taupe,
          position: 'relative',
        }}
      >
        {/* Double filet doré en haut */}
        <div style={{ position: 'absolute', top: 26, left: 60, right: 60, height: 1, background: gold }} />
        <div style={{ position: 'absolute', top: 33, left: 60, right: 60, height: 1, background: gold }} />
        {/* Double filet doré en bas */}
        <div style={{ position: 'absolute', bottom: 26, left: 60, right: 60, height: 1, background: gold }} />
        <div style={{ position: 'absolute', bottom: 33, left: 60, right: 60, height: 1, background: gold }} />

        {/* Monogramme ש-פ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} alt="" width={140} height={140} style={{ marginBottom: 18 }} />

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
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          Mariage
        </div>

        {/* Shmouel & Perla — bronze plein + & italique sand-deep. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
            fontSize: 82,
            color: bronze,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          <span>Shmouel</span>
          <span
            style={{
              color: sandDeep,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 62,
              lineHeight: 1,
            }}
          >
            &amp;
          </span>
          <span>Perla</span>
        </div>

        {/* Noms hébreux — FrankRuhlLibre + & italique sand-deep central. */}
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
            fontFamily: 'FrankRuhlLibre',
          }}
        >
          <span>{Array.from('שמואל').reverse().join('')}</span>
          <span
            style={{
              color: sandDeep,
              fontStyle: 'italic',
              fontFamily: 'Playfair',
              fontSize: 38,
              lineHeight: 1,
            }}
          >
            &amp;
          </span>
          <span>{Array.from('פערלה').reverse().join('')}</span>
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
    {
      ...size,
      fonts: [
        { name: 'Playfair', data: playfairRegular, weight: 500, style: 'normal' },
        { name: 'Playfair', data: playfairItalic, weight: 400, style: 'italic' },
        { name: 'Playfair', data: playfairBold, weight: 700, style: 'normal' },
        { name: 'FrankRuhlLibre', data: frankFont, weight: 400, style: 'normal' },
      ],
    }
  );
}
