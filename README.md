# Invitation Mariage — Shmouel & Perla (Next.js)

Site d'invitation web pour le mariage de Shmouel & Perla, 3 septembre 2026.

Structure Next.js 15 / React 19 / TypeScript, calquée sur l'app de la Bar Mitsva de Chmouel Journo.

## Structure du projet

```
Mariage-Shmouel-Perla-nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Layout racine + metadata + favicon
│   │   ├── page.tsx          # Composition de l'invitation
│   │   └── globals.css       # Tous les styles (fonts, layout, animations)
│   ├── components/
│   │   ├── BackgroundVideo.tsx  # Vidéo fixed scrubbée intro + scroll
│   │   ├── Countdown.tsx        # Compte à rebours
│   │   ├── Hero.tsx             # Hero (בס״ד + monogramme + noms + countdown)
│   │   ├── HebrewArc.tsx        # Phrase hébraïque en arc SVG
│   │   ├── Ornament.tsx         # Helper pour placer les ornements floraux
│   │   ├── FairePart.tsx        # Bloc invitation formelle
│   │   ├── Details.tsx          # Save the Date (date + heures + lieu)
│   │   ├── Bracha.tsx           # Mazal Tov (bénédiction hébraïque)
│   │   ├── RSVP.tsx             # Formulaire → Google Apps Script
│   │   └── Footer.tsx           # Signature LTD
│   └── lib/
│       └── content.ts        # Toutes les données (noms, date, lieu, endpoints…)
├── public/
│   ├── fonts/               # Frank Ruhl Libre (Regular + Bold)
│   ├── images/              # wedding-logo, ltd-logo, rings, favicons, ornaments/
│   └── video/               # intro.mp4
├── google-apps-script.gs    # Backend RSVP
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## Développement

```bash
npm install
npm run dev
```

Le site tourne sur `http://localhost:3000` avec hot reload.

## Build & déploiement

```bash
npm run build
```

Produit un site statique dans `out/` (grâce à `output: 'export'` dans `next.config.ts`).
Prêt à déployer sur GitHub Pages, Vercel, Netlify, Cloudflare Pages, n'importe où.

## Backend RSVP

Voir `google-apps-script.gs` — le code de la Web App Google Apps Script.
L'endpoint est déjà branché dans `src/lib/content.ts` (`content.rsvp.endpoint`).

## Design

- **Palette** : Sable Chaud (crème `#F5EFE6`, sable `#C9A87D`, taupe `#6B5B4A`)
- **Typographies** :
  - Frank Ruhl Libre — hébreu (`@font-face` local)
  - Didot — display Latin
  - Snell Roundhand — script cursive
  - Cochin / Palatino — corps de texte

## Développé par

[La Touche Designer](https://wa.me/33652426663) — Mayane Cohen
