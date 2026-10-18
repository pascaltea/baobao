// Le parcours : chaque thème devient une unité, découpée en leçons de 4 ou 5 mots,
// suivie d'une révision d'unité. Les leçons se débloquent dans l'ordre.

import { chargerJSON } from "./app.js";

const MOTS_PAR_LECON = 5;
// Palette chaude et joyeuse, une couleur par unité.
const COULEURS = ["#ff9f0f", "#f4615a", "#1fb8b0", "#6c5ce7", "#ffb703", "#ef5d8a", "#20b26b", "#3d8bfd"];

export async function chargerParcours(dossier) {
  const themes = await chargerJSON(`${dossier}index.json`);
  const listes = await Promise.all(themes.map((t) => chargerJSON(dossier + t.fichier)));
  return themes.map((theme, i) => {
    const mots = listes[i].map((m) => ({ ...m, theme: theme.id }));
    const nbLecons = Math.ceil(mots.length / MOTS_PAR_LECON);
    const taille = Math.ceil(mots.length / nbLecons);
    const lecons = [];
    for (let k = 0; k < nbLecons; k++) {
      lecons.push({ cle: `${theme.id}:${k}`, unite: theme.id, titre: `Leçon ${k + 1}`, mots: mots.slice(k * taille, (k + 1) * taille) });
    }
    lecons.push({ cle: `${theme.id}:revision`, unite: theme.id, titre: "Révision de l'unité", revision: true, mots });
    return { ...theme, numero: i + 1, couleur: COULEURS[i % COULEURS.length], mots, lecons };
  });
}

// Phrases du quotidien : « decoupe » sépare les mots par des espaces,
// ce qui sert à l'exercice « remettre dans l'ordre ».
export async function chargerRoutines(dossierData) {
  const routines = await chargerJSON(`${dossierData}quotidien.json`);
  for (const r of routines) {
    r.phrases = r.phrases.map((p) => ({
      ...p,
      hanzi: p.decoupe.replace(/\s+/g, ""),
      morceaux: p.decoupe.split(/\s+/).filter((t) => !/^[，。！？、]+$/.test(t)),
      theme: r.id,
      phrase: true,
    }));
  }
  return routines;
}

export function toutesLesLecons(unites) {
  return unites.flatMap((u) => u.lecons);
}

// « fait », « actuel » (la prochaine à faire) ou « verrou ».
export function etatsLecons(unites, terminees) {
  const etats = new Map();
  let actuelTrouve = false;
  for (const lecon of toutesLesLecons(unites)) {
    if (terminees.has(lecon.cle)) etats.set(lecon.cle, "fait");
    else if (!actuelTrouve) { etats.set(lecon.cle, "actuel"); actuelTrouve = true; }
    else etats.set(lecon.cle, "verrou");
  }
  return etats;
}
