// Image d'un mot : une illustration quand il en a une (famille, pronoms,
// où les emojis se ressemblent trop), sinon son emoji.

const RACINE = location.pathname.includes("/pages/") ? "../" : "";

export function visuel(mot, classe = "") {
  if (!mot) return "";
  if (mot.image) return `<img class="illu ${classe}" src="${RACINE}${mot.image}" alt="" draggable="false">`;
  return mot.emoji ?? "";
}

// Ce qui distingue deux images (pour ne pas proposer deux fois la même).
export const cleVisuel = (mot) => mot.image || mot.emoji;
