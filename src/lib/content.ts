/**
 * Contenu du mariage — modifier ici pour changer les infos affichées sur le site.
 */
export const content = {
  maries: {
    prenomLatin: 'Shmouel',
    conjointe: 'Perla',
    prenomHebrew: 'שמואל ופערלה',
  },
  familles: {
    marie: 'Famille Smadja',
    mariee: 'Famille Schoukroun',
  },
  dateGrégorienne: '3 Septembre 2026',
  dateHebrew: 'כ״א אלול התשפ״ו',
  dateISO: '2026-09-03T17:00:00+02:00',
  deadlineRSVP: 'avant le 15 août 2026',
  horaires: {
    kabalatPanim: '17:00',
    houppa: '18:00',
  },
  lieu: {
    nom: 'Salle Baccara',
    adresse: '61 rue Saint André · 93000 Bobigny',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Salle+Baccara+61+rue+Saint+André+93000+Bobigny',
  },
  memorial: {
    intro: 'Une pensée pour nos grands-parents Papi Yossef, Mamie Irène,',
    highlight: 'et tout particulièrement pour notre cher père',
    nom: 'Éric Smadja',
    suffixe: 'ז״ל',
  },
  bracha: {
    hebrewLines: [
      'מזל טוב!',
      'שיהיה בניין עדי עד על אדני התורה והמצוות',
      'ושתזכו לחיים מאושרים בכל התחומים',
    ],
    traduction:
      "Que ce soit un édifice Éternel basé sur la Thora et les Mitsvot, et que votre vie soit heureuse dans tous les domaines.",
  },
  kolSasson: 'קול ששון וקול שמחה קול חתן וקול כלה',
  bsd: 'בס״ד',
  rsvp: {
    endpoint:
      'https://script.google.com/macros/s/AKfycbzF0zM5bkhBpLp5e9QkkjibP0VHPpqyVQCBzKUXaZBpIPPbfCV7yA6OQ20wTLM7JEwFTg/exec',
    token: 'shmouel-perla-2026',
  },
  ltd: {
    label: 'Créé par La Touche Designer',
    tel: '+33 6 52 42 66 63',
    whatsapp: 'https://wa.me/33652426663',
    rights: '© 2026 La Touche Designer · Tous droits réservés',
  },
  images: {
    weddingLogo: '/images/wedding-logo.png',
    ltdLogo: '/images/ltd-logo.png',
    rings: '/images/rings.png',
    colombe: '/images/colombe.png',
    video: '/video/intro.mp4',
    music: '/audio/od-yishama.mp3',
    ornaments: [
      '/images/ornaments/ornament-01.png',
      '/images/ornaments/ornament-02.png',
      '/images/ornaments/ornament-03.png',
      '/images/ornaments/ornament-04.png',
      '/images/ornaments/ornament-05.png',
      '/images/ornaments/ornament-06.png',
      '/images/ornaments/ornament-07.png',
      '/images/ornaments/ornament-08.png',
    ] as const,
  },
} as const;

export type Content = typeof content;
