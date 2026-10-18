// Bao (宝 bǎo, « trésor »), le panda mascotte, dessiné en SVG pour pouvoir
// changer d'expression et s'animer (clignement des yeux, saut de joie…).
//   content   sourire, au repos
//   bravo     bouche ouverte, bras levés
//   oups      petite moue désolée
//   parle     bouche ouverte, pour les exercices d'écoute
//   dort      yeux fermés (pause, rien à réviser)

const BOUCHES = {
  content: `<path d="M51 84 Q60 93 69 84" fill="none" stroke="#2d2a32" stroke-width="3" stroke-linecap="round"/>`,
  bravo: `<path d="M49 82 Q60 101 71 82 Z" fill="#e8423f" stroke="#2d2a32" stroke-width="3" stroke-linejoin="round"/>`,
  oups: `<path d="M52 90 Q60 84 68 90" fill="none" stroke="#2d2a32" stroke-width="3" stroke-linecap="round"/>`,
  parle: `<ellipse cx="60" cy="86" rx="6" ry="5" fill="#e8423f" stroke="#2d2a32" stroke-width="3"/>`,
  dort: `<path d="M54 86 Q60 89 66 86" fill="none" stroke="#2d2a32" stroke-width="3" stroke-linecap="round"/>`,
};

function yeux(humeur) {
  if (humeur === "dort") {
    return `<path d="M38 60 Q44 64 50 60 M70 60 Q76 64 82 60" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  }
  const sourcils = humeur === "oups"
    ? `<path d="M37 45 L49 49 M83 45 L71 49" stroke="#2d2a32" stroke-width="3" stroke-linecap="round"/>`
    : "";
  return `${sourcils}
    <g class="oeil"><circle cx="44" cy="60" r="6" fill="#fff"/><circle cx="45" cy="61" r="3.2" fill="#2d2a32"/><circle cx="46.5" cy="59" r="1.2" fill="#fff"/></g>
    <g class="oeil"><circle cx="76" cy="60" r="6" fill="#fff"/><circle cx="75" cy="61" r="3.2" fill="#2d2a32"/><circle cx="76.5" cy="59" r="1.2" fill="#fff"/></g>`;
}

function bras(humeur) {
  return humeur === "bravo"
    ? `<ellipse cx="14" cy="58" rx="8" ry="15" transform="rotate(-25 14 58)" fill="#2d2a32"/>
       <ellipse cx="106" cy="58" rx="8" ry="15" transform="rotate(25 106 58)" fill="#2d2a32"/>`
    : `<ellipse cx="20" cy="100" rx="8" ry="13" transform="rotate(20 20 100)" fill="#2d2a32"/>
       <ellipse cx="100" cy="100" rx="8" ry="13" transform="rotate(-20 100 100)" fill="#2d2a32"/>`;
}

export function mascotte(humeur = "content", classe = "") {
  return `<svg class="mascotte-svg ${humeur} ${classe}" viewBox="0 0 120 124" role="img" aria-label="Bao le panda">
    ${bras(humeur)}
    <circle cx="25" cy="28" r="14" fill="#2d2a32"/>
    <circle cx="95" cy="28" r="14" fill="#2d2a32"/>
    <ellipse cx="60" cy="64" rx="45" ry="41" fill="#fff" stroke="#2d2a32" stroke-width="3"/>
    <ellipse cx="43" cy="60" rx="12" ry="15" transform="rotate(-25 43 60)" fill="#2d2a32"/>
    <ellipse cx="77" cy="60" rx="12" ry="15" transform="rotate(25 77 60)" fill="#2d2a32"/>
    ${yeux(humeur)}
    <circle cx="31" cy="79" r="6" fill="#ffb3c1" opacity=".8"/>
    <circle cx="89" cy="79" r="6" fill="#ffb3c1" opacity=".8"/>
    <ellipse cx="60" cy="76" rx="6" ry="4.2" fill="#2d2a32"/>
    ${BOUCHES[humeur] ?? BOUCHES.content}
    <path d="M24 101 Q60 119 96 101 L93 111 Q60 127 27 111 Z" fill="#f25c54"/>
    <circle cx="60" cy="114" r="4.5" fill="#ffc83d"/>
  </svg>`;
}
