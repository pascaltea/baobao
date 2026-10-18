// Génère les illustrations SVG de la famille et des pronoms, dans le style de Bao :
// formes rondes, contour noir panda, joues roses, couleurs de la forêt de bambous.
//
// Chaque illustration est pensée pour lever une ambiguïté :
//  - frères et sœurs : comparés à une silhouette grise (« toi ») plus grande ou plus petite ;
//  - grands-parents : badge papa ou maman pour le côté de la famille ;
//  - pronoms : une flèche part de celui qui parle vers la personne désignée.
//
// Usage : node outils/illustrations.mjs   (écrit dans assets/illustrations/)

import { mkdirSync, writeFileSync } from "node:fs";

const CONTOUR = "#2d2a32";
const PEAU = "#ffd9b8";
const JOUE = "#ffb3c1";
const GRIS = "#c5d3cb";
const CHEVEUX = { brun: "#4a3226", noir: "#2d2a32", chatain: "#8a5a3b", gris: "#d9dde2", roux: "#c8642e" };
const HABITS = { bleu: "#4aa8e8", corail: "#f25c54", vert: "#3fb871", violet: "#9b6ee8", jaune: "#f5b324", rose: "#ef7fa8", turquoise: "#2bb3a3", orange: "#f08a3c" };
const FONDS = { menthe: "#dff5e6", rose: "#ffe3e8", bleu: "#e2f0ff", creme: "#fff1d6", lilas: "#efe7ff" };

// ---------- Morceaux de personnage (repère local : pieds en 0, tête vers le haut) ----------

const cheveuxDerriere = {
  long: (c) => `<path d="M-25 -72 C-27 -99 27 -99 25 -72 L26 -40 C10 -34 -10 -34 -26 -40 Z" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
  queue: (c) => `<ellipse cx="23" cy="-62" rx="7" ry="15" transform="rotate(-15 23 -62)" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
  carre: (c) => `<path d="M-26 -72 C-28 -99 28 -99 26 -72 L26 -52 L-26 -52 Z" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
  couettes: (c) => `<circle cx="-26" cy="-78" r="8" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/><circle cx="26" cy="-78" r="8" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
  chignon: (c) => `<circle cx="0" cy="-99" r="9" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
};

const frange = (c) => `<path d="M-23 -71 C-24 -95 24 -95 23 -71 C15 -86 -5 -88 -23 -71 Z" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5" stroke-linejoin="round"/>`;

const cheveuxDevant = {
  court: (c) => `<path d="M-23 -70 C-25 -92 -10 -98 0 -97 C12 -98 25 -92 23 -70 C19 -82 10 -86 0 -85 C-10 -86 -19 -82 -23 -70 Z" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5" stroke-linejoin="round"/>`,
  herisse: (c) => `<path d="M-23 -70 C-25 -90 -14 -96 -12 -96 L-9 -104 L-3 -97 L3 -106 L8 -97 L14 -103 L15 -94 C22 -90 25 -82 23 -70 C19 -82 10 -86 0 -85 C-10 -86 -19 -82 -23 -70 Z" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5" stroke-linejoin="round"/>`,
  long: frange,
  queue: frange,
  carre: frange,
  couettes: frange,
  chignon: frange,
  papy: (c) => `<circle cx="-21" cy="-75" r="6.5" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/><circle cx="21" cy="-75" r="6.5" fill="${c}" stroke="${CONTOUR}" stroke-width="2.5"/>`,
  bebe: (c) => `<path d="M-3 -93 C2 -102 12 -98 8 -92 C5 -88 0 -91 3 -94" fill="none" stroke="${CONTOUR}" stroke-width="2.5" stroke-linecap="round"/>`,
};

function personnage(o) {
  const { x, s = 1, coiffure = "court", cheveux = CHEVEUX.brun, habit = HABITS.bleu, silhouette = false } = o;
  const t = `translate(${x} 110) scale(${s})`;
  if (silhouette) {
    // « Toi » : silhouette grise de comparaison, sans visage.
    return `<g transform="${t}" opacity=".85">
      ${(cheveuxDerriere[coiffure] ?? (() => ""))(GRIS).replaceAll(CONTOUR, GRIS)}
      <path d="M-24 0 L-24 -28 Q-24 -50 0 -50 Q24 -50 24 -28 L24 0 Z" fill="${GRIS}"/>
      <circle cx="0" cy="-72" r="22" fill="${GRIS}"/>
    </g>`;
  }
  const yeux = `<circle cx="-8" cy="-73" r="2.8" fill="${CONTOUR}"/><circle cx="8" cy="-73" r="2.8" fill="${CONTOUR}"/>
    <circle cx="-7" cy="-74" r=".9" fill="#fff"/><circle cx="9" cy="-74" r=".9" fill="#fff"/>`;
  const joues = `<circle cx="-13" cy="-64" r="4.2" fill="${JOUE}" opacity=".85"/><circle cx="13" cy="-64" r="4.2" fill="${JOUE}" opacity=".85"/>`;
  const sourire = `<path d="M-6 -63 Q0 -57 6 -63" fill="none" stroke="${CONTOUR}" stroke-width="2.4" stroke-linecap="round"/>`;
  const lunettes = o.lunettes
    ? `<circle cx="-8" cy="-73" r="6.5" fill="none" stroke="${CONTOUR}" stroke-width="2"/><circle cx="8" cy="-73" r="6.5" fill="none" stroke="${CONTOUR}" stroke-width="2"/><path d="M-1.5 -73 H1.5" stroke="${CONTOUR}" stroke-width="2"/>`
    : "";
  const barbe = o.barbe
    ? `<path d="M-19 -70 Q-19 -47 0 -47 Q19 -47 19 -70 Q13 -58 0 -58 Q-13 -58 -19 -70 Z" fill="${cheveux}" stroke="${CONTOUR}" stroke-width="2.2"/>`
    : "";
  const moustache = o.moustache
    ? `<path d="M-9 -64 Q-4 -68 0 -64.5 Q4 -68 9 -64 Q4 -60.5 0 -62.5 Q-4 -60.5 -9 -64 Z" fill="${cheveux}" stroke="${CONTOUR}" stroke-width="1.5"/>`
    : "";
  const noeud = o.noeud
    ? `<path d="M10 -95 L20 -100 L20 -88 Z M10 -95 L0 -100 L0 -88 Z" fill="${o.noeud}" stroke="${CONTOUR}" stroke-width="2" stroke-linejoin="round" transform="translate(4 2)"/>`
    : "";
  const tetine = o.tetine
    ? `<circle cx="0" cy="-60" r="5" fill="${HABITS.corail}" stroke="${CONTOUR}" stroke-width="2"/><circle cx="0" cy="-60" r="2" fill="#fff"/>`
    : "";
  const boucles = o.boucles ? `<circle cx="-22" cy="-62" r="2.6" fill="${HABITS.jaune}"/><circle cx="22" cy="-62" r="2.6" fill="${HABITS.jaune}"/>` : "";
  const livre = o.livre
    ? `<rect x="-15" y="-36" width="30" height="21" rx="3" fill="${HABITS.corail}" stroke="${CONTOUR}" stroke-width="2.3"/><path d="M0 -36 V-15" stroke="${CONTOUR}" stroke-width="2"/><path d="M-11 -30 H-4 M4 -30 H11" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`
    : "";
  const col = `<path d="M-8 -50 L0 -42 L8 -50" fill="none" stroke="${CONTOUR}" stroke-width="2.2" stroke-linejoin="round"/>`;
  return `<g transform="${t}">
    ${(cheveuxDerriere[coiffure] ?? (() => ""))(cheveux)}
    <path d="M-24 0 L-24 -28 Q-24 -50 0 -50 Q24 -50 24 -28 L24 0 Z" fill="${habit}" stroke="${CONTOUR}" stroke-width="2.5" stroke-linejoin="round"/>
    ${col}
    <circle cx="0" cy="-72" r="22" fill="${PEAU}" stroke="${CONTOUR}" stroke-width="2.5"/>
    ${(cheveuxDevant[coiffure] ?? (() => ""))(cheveux)}
    ${joues}${yeux}${lunettes}${barbe}${moustache}${o.tetine ? "" : sourire}${tetine}${noeud}${boucles}${livre}
  </g>`;
}

// Petit badge rond dans le coin : « côté papa » ou « côté maman ».
function badge(qui) {
  const mini = qui === "papa"
    ? personnage({ x: 0, s: 0.42, coiffure: "court", cheveux: CHEVEUX.brun, habit: HABITS.bleu })
    : personnage({ x: 0, s: 0.42, coiffure: "long", cheveux: CHEVEUX.noir, habit: HABITS.corail });
  return `<g transform="translate(97 26)">
    <circle r="19" fill="#fff" stroke="${CONTOUR}" stroke-width="2.5"/>
    <g transform="translate(0 -32)"><clipPath id="badge-${qui}"><circle cx="0" cy="32" r="16.5"/></clipPath><g clip-path="url(#badge-${qui})">${mini.replace("translate(0 110)", "translate(0 66)")}</g></g>
  </g>`;
}

// Flèche en pointillés, de celui qui parle vers la personne désignée.
const fleche = (d) => `<path d="${d}" fill="none" stroke="${HABITS.corail}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7" marker-end="url(#pointe)"/>`;
const POINTE = `<defs><marker id="pointe" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${HABITS.corail}"/></marker></defs>`;

function scene(fond, contenu, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  ${POINTE}
  <circle cx="60" cy="60" r="56" fill="${FONDS[fond]}"/>
  <ellipse cx="60" cy="111" rx="44" ry="5" fill="${CONTOUR}" opacity=".08"/>
  ${contenu}
  ${extra}
</svg>`;
}

const maison = () => `
  <path d="M22 62 L60 28 L98 62" fill="${HABITS.corail}" stroke="${CONTOUR}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="30" y="58" width="60" height="50" rx="4" fill="#fff6e6" stroke="${CONTOUR}" stroke-width="3"/>
  <rect x="52" y="78" width="16" height="30" rx="3" fill="${HABITS.vert}" stroke="${CONTOUR}" stroke-width="2.5"/>
  <rect x="36" y="66" width="12" height="12" rx="2" fill="${FONDS.bleu}" stroke="${CONTOUR}" stroke-width="2.5"/>
  <rect x="72" y="66" width="12" height="12" rx="2" fill="${FONDS.bleu}" stroke="${CONTOUR}" stroke-width="2.5"/>
  <path d="M60 46 C56 40 49 44 53 49 L60 55 L67 49 C71 44 64 40 60 46 Z" fill="${HABITS.rose}" stroke="${CONTOUR}" stroke-width="2"/>`;

// ---------- Les illustrations ----------

const papy = { coiffure: "papy", cheveux: CHEVEUX.gris, lunettes: true, moustache: true, habit: HABITS.turquoise };
const mamie = { coiffure: "chignon", cheveux: CHEVEUX.gris, lunettes: true, habit: HABITS.violet, boucles: true };
const garcon = { coiffure: "herisse", cheveux: CHEVEUX.brun, habit: HABITS.vert };
const fille = { coiffure: "couettes", cheveux: CHEVEUX.noir, habit: HABITS.rose, noeud: HABITS.corail };
const ado = { coiffure: "queue", cheveux: CHEVEUX.noir, habit: HABITS.jaune };
const toi = (x, s, coiffure = "court") => personnage({ x, s, coiffure, silhouette: true });

const ILLUSTRATIONS = {
  famille: {
    baba: scene("bleu", personnage({ x: 60, s: 0.95, coiffure: "court", cheveux: CHEVEUX.brun, habit: HABITS.bleu })),
    mama: scene("rose", personnage({ x: 60, s: 0.95, coiffure: "long", cheveux: CHEVEUX.noir, habit: HABITS.corail })),
    // Frères et sœurs : comparés à « toi » (silhouette grise)
    gege: scene("menthe", toi(36, 0.62) + personnage({ x: 76, s: 0.92, ...garcon, habit: HABITS.bleu })),
    didi: scene("menthe", toi(42, 0.88) + personnage({ x: 86, s: 0.56, ...garcon })),
    jiejie: scene("rose", toi(36, 0.62) + personnage({ x: 76, s: 0.92, ...ado })),
    meimei: scene("rose", toi(42, 0.88) + personnage({ x: 86, s: 0.56, ...fille })),
    // Grands-parents : badge du côté de la famille
    yeye: scene("bleu", personnage({ x: 54, s: 0.9, ...papy }), badge("papa")),
    nainai: scene("bleu", personnage({ x: 54, s: 0.9, ...mamie }), badge("papa")),
    waigong: scene("rose", personnage({ x: 54, s: 0.9, ...papy, habit: HABITS.orange }), badge("maman")),
    waipo: scene("rose", personnage({ x: 54, s: 0.9, ...mamie, habit: HABITS.rose }), badge("maman")),
    baobao: scene("creme", personnage({ x: 60, s: 0.62, coiffure: "bebe", cheveux: CHEVEUX.brun, habit: HABITS.jaune, tetine: true })),
    erzi: scene("menthe", toi(38, 0.95, "long") + personnage({ x: 86, s: 0.58, ...garcon })),
    nver: scene("rose", toi(38, 0.95, "court") + personnage({ x: 86, s: 0.58, ...fille })),
    shushu: scene("menthe", personnage({ x: 60, s: 0.95, coiffure: "court", cheveux: CHEVEUX.noir, habit: HABITS.vert, barbe: true })),
    ayi: scene("lilas", personnage({ x: 60, s: 0.95, coiffure: "carre", cheveux: CHEVEUX.chatain, habit: HABITS.violet, boucles: true })),
    pengyou: scene("creme",
      `<path d="M50 88 Q60 82 70 88" stroke="${CONTOUR}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M50 88 Q60 82 70 88" stroke="${PEAU}" stroke-width="4" stroke-linecap="round" fill="none"/>`
      + personnage({ x: 38, s: 0.68, ...garcon, habit: HABITS.orange }) + personnage({ x: 82, s: 0.68, ...fille, habit: HABITS.turquoise })
      + `<path d="M60 22 C56 16 49 20 53 25 L60 31 L67 25 C71 20 64 16 60 22 Z" fill="${HABITS.corail}" stroke="${CONTOUR}" stroke-width="2"/>`),
    laoshi: scene("creme", personnage({ x: 60, s: 0.95, coiffure: "chignon", cheveux: CHEVEUX.noir, habit: HABITS.turquoise, lunettes: true, livre: true })),
    jia: scene("menthe", maison()),
  },
  pronoms: {
    // Celui qui parle se désigne lui-même
    wo: scene("menthe", personnage({ x: 44, s: 0.8, ...garcon }) + toi(92, 0.7), fleche("M70 30 C88 36 82 58 66 66")),
    // Celui qui parle (gris) désigne la personne en face
    ni: scene("bleu", toi(30, 0.72) + personnage({ x: 86, s: 0.8, ...garcon, habit: HABITS.bleu }), fleche("M40 40 Q60 22 74 36")),
    // On parle d'un garçon / d'une fille qui n'est pas là, plus loin
    ta: scene("menthe", toi(24, 0.6) + toi(50, 0.6) + personnage({ x: 92, s: 0.72, ...garcon, habit: HABITS.orange }), fleche("M28 46 Q58 14 82 38")),
    "ta-elle": scene("rose", toi(24, 0.6) + toi(50, 0.6) + personnage({ x: 92, s: 0.72, ...fille }), fleche("M28 46 Q58 14 82 38")),
    // Nous : celui qui parle et son groupe, entourés
    women: scene("creme",
      `<ellipse cx="44" cy="80" rx="38" ry="34" fill="none" stroke="${HABITS.corail}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>`
      + personnage({ x: 30, s: 0.6, ...garcon }) + personnage({ x: 58, s: 0.6, ...fille }) + toi(100, 0.55)),
  },
};

for (const [dossier, images] of Object.entries(ILLUSTRATIONS)) {
  mkdirSync(`assets/illustrations/${dossier}`, { recursive: true });
  for (const [nom, svg] of Object.entries(images)) writeFileSync(`assets/illustrations/${dossier}/${nom}.svg`, svg.replace(/\n\s*/g, "\n") + "\n");
}
console.log("Illustrations écrites :", Object.values(ILLUSTRATIONS).reduce((n, x) => n + Object.keys(x).length, 0));
