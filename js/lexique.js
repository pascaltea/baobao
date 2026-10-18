// « Mes mots » : tout le vocabulaire et les phrases, avec la solidité de la
// mémoire (niveau de répétition espacée), une recherche et des filtres.

import { prononcer, afficherProfilActif, activerHorsLigne } from "./app.js";
import { chargerParcours, chargerRoutines } from "./parcours.js";
import { profilActif, niveauMot, NIVEAU_MAX } from "./profils.js";
import { rubyHTML } from "./pinyin.js";
import { visuel } from "./visuel.js";

const $ = (id) => document.getElementById(id);
let elements = [];
let filtre = "appris";

// Comparaison sans accents ni tons : « mao » trouve « māo ».
const simplifier = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function afficher() {
  const recherche = simplifier($("recherche").value.trim());
  const zone = $("liste");
  zone.innerHTML = "";
  const visibles = elements.filter((e) => {
    const niveau = niveauMot(e.id);
    if (filtre === "appris" && niveau === 0) return false;
    if (filtre === "fragiles" && (niveau === 0 || niveau > 2)) return false;
    return !recherche || simplifier(`${e.fr} ${e.pinyin} ${e.hanzi}`).includes(recherche);
  });
  for (const e of visibles.slice(0, 300)) {
    const niveau = niveauMot(e.id);
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="lx-mot" aria-label="Écouter">
        <span class="lx-emoji">${visuel(e)}</span>
        <span class="lx-hanzi">${rubyHTML(e.hanzi, e.pinyin)}</span>
        <span class="lx-fr"></span>
      </button>
      <span class="jauge" title="Mémoire : ${niveau}/${NIVEAU_MAX}">${Array.from({ length: NIVEAU_MAX }, (_, i) => `<i class="${i < niveau ? "plein" : ""}"></i>`).join("")}</span>`;
    li.querySelector(".lx-fr").textContent = `${e.fr} · ${e.groupe}`;
    li.querySelector("button").addEventListener("click", () => prononcer(e.hanzi));
    zone.appendChild(li);
  }
  if (!visibles.length) {
    zone.innerHTML = `<li class="vide">${filtre === "fragiles" ? "Aucun mot fragile, bravo ! 💪" : "Aucun mot ici pour l'instant : fais une leçon pour remplir ton lexique."}</li>`;
  }
}

for (const b of document.querySelectorAll(".filtre")) {
  b.addEventListener("click", () => {
    filtre = b.dataset.filtre;
    document.querySelectorAll(".filtre").forEach((x) => x.classList.toggle("actif", x === b));
    afficher();
  });
}
$("recherche").addEventListener("input", afficher);

if (!profilActif()) {
  location.href = "../index.html";
} else {
  afficherProfilActif();
  activerHorsLigne("../");
  const [unites, routines] = await Promise.all([chargerParcours("../data/vocabulaire/"), chargerRoutines("../data/")]);
  elements = [
    ...unites.flatMap((u) => u.mots.map((m) => ({ ...m, groupe: `${u.emoji} ${u.titre}` }))),
    ...routines.flatMap((r) => r.phrases.map((p) => ({ ...p, groupe: `💬 ${r.titre}` }))),
  ];
  const appris = elements.filter((e) => niveauMot(e.id) > 0).length;
  const solides = elements.filter((e) => niveauMot(e.id) >= 4).length;
  $("resume").textContent = `${appris} appris sur ${elements.length} · ${solides} bien ancrés dans la mémoire`;
  afficher();
}
