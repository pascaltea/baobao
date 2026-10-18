// Outils pinyin : découpage en syllabes, couleurs des tons, variantes de tons.
// Couleurs (comme dans l'appli Pleco) : 1 rouge, 2 vert, 3 bleu, 4 violet, neutre gris.

const VOYELLES = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", ü: "ǖǘǚǜ" };

// « ā » → ["a", 1], « ǚ » → ["ü", 3]…
const MARQUES = {};
for (const [base, accents] of Object.entries(VOYELLES)) {
  [...accents].forEach((c, i) => { MARQUES[c] = [base, i + 1]; });
}

const SYLLABE = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(iang|iong|uang|ueng|ang|eng|ing|ong|uai|iao|ian|uan|üan|ai|ei|ao|ou|an|en|in|un|ün|ia|ie|iu|ua|uo|ui|üe|ue|er|a|o|e|i|u|ü)$/;

export function tonSyllabe(syllabe) {
  for (const c of syllabe) if (MARQUES[c]) return MARQUES[c][1];
  return 5;
}

function sansTon(texte) {
  return [...texte.toLowerCase()].map((c) => MARQUES[c]?.[0] ?? c).join("");
}

// Toutes les façons de découper un mot pinyin (sans espace) en syllabes valides.
function decoupagesMot(mot) {
  if (mot === "") return [[]];
  const resultats = [];
  for (let n = Math.min(6, mot.length); n >= 1; n--) {
    const debut = mot.slice(0, n);
    if (!SYLLABE.test(sansTon(debut))) continue;
    for (const suite of decoupagesMot(mot.slice(n))) resultats.push([debut, ...suite]);
  }
  return resultats;
}

// Découpe le pinyin en exactement `nb` syllabes (une par caractère), ou null.
export function decouper(pinyin, nb) {
  const mots = pinyin.replace(/['’]/g, " ").split(/\s+/).filter(Boolean);
  const chercher = (i, reste) => {
    if (i === mots.length) return reste === 0 ? [] : null;
    for (const decoupage of decoupagesMot(mots[i])) {
      if (decoupage.length > reste) continue;
      const suite = chercher(i + 1, reste - decoupage.length);
      if (suite) return [...decoupage, ...suite];
    }
    return null;
  };
  return chercher(0, nb);
}

const echapper = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Caractères avec leur pinyin coloré au-dessus (balises <ruby>).
export function rubyHTML(hanzi, pinyin) {
  const caracteres = [...hanzi];
  const syllabes = decouper(pinyin, caracteres.length);
  if (!syllabes) {
    return `<ruby>${echapper(hanzi)}<rt>${echapper(pinyin)}</rt></ruby>`;
  }
  return caracteres
    .map((c, i) => `<ruby>${echapper(c)}<rt class="ton${tonSyllabe(syllabes[i])}">${echapper(syllabes[i])}</rt></ruby>`)
    .join("");
}

// Pinyin seul, chaque syllabe dans la couleur de son ton.
export function pinyinColore(pinyin, hanzi) {
  const syllabes = decouper(pinyin, [...hanzi].length);
  if (!syllabes) return echapper(pinyin);
  return syllabes.map((s) => `<span class="ton${tonSyllabe(s)}">${echapper(s)}</span>`).join(" ");
}

// Caractères colorés selon leur ton (sans pinyin) : aide visuelle discrète.
export function hanziColore(hanzi, pinyin) {
  const caracteres = [...hanzi];
  const syllabes = decouper(pinyin, caracteres.length);
  if (!syllabes) return echapper(hanzi);
  return caracteres.map((c, i) => `<span class="ton${tonSyllabe(syllabes[i])}">${echapper(c)}</span>`).join("");
}

// Fausses réponses pour l'exercice « bon pinyin » : même mot, autres tons.
export function variantesTon(pinyin, nb = 3) {
  const positions = [...pinyin].map((c, i) => (MARQUES[c] ? i : -1)).filter((i) => i >= 0);
  if (positions.length === 0) return [];
  const variantes = new Set();
  for (let essai = 0; essai < 60 && variantes.size < nb; essai++) {
    const lettres = [...pinyin];
    // On change le ton d'une ou deux syllabes.
    const combien = positions.length > 1 && Math.random() < 0.4 ? 2 : 1;
    for (const pos of [...positions].sort(() => Math.random() - 0.5).slice(0, combien)) {
      const [base, ton] = MARQUES[lettres[pos]];
      let nouveau = ton;
      while (nouveau === ton) nouveau = 1 + Math.floor(Math.random() * 4);
      lettres[pos] = VOYELLES[base][nouveau - 1];
    }
    const variante = lettres.join("");
    if (variante !== pinyin) variantes.add(variante);
  }
  return [...variantes];
}
