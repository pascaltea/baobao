// « Au quotidien » : les phrases à dire aux enfants, rangées par moment de la journée.
// Chaque phrase s'écoute, se répète (micro) et se coche quand on l'a vraiment dite.

import { prononcer, afficherProfilActif, activerHorsLigne } from "./app.js";
import { chargerRoutines } from "./parcours.js";
import { profilActif, niveauMot, phrasesDitesAujourdhui, marquerPhraseDite } from "./profils.js";
import { rubyHTML } from "./pinyin.js";
import { boutonsMicro } from "./micro.js";

const $ = (id) => document.getElementById(id);
let routines = [];

function afficherListe() {
  const zone = $("routines");
  zone.innerHTML = "";
  for (const r of routines) {
    const vues = r.phrases.filter((p) => niveauMot(p.id) > 0).length;
    const tuile = document.createElement("button");
    tuile.className = "tuile";
    tuile.innerHTML = `<span class="grand">${r.emoji}</span><strong>${r.titre}</strong><br><small>${vues} / ${r.phrases.length} phrases apprises</small>`;
    tuile.addEventListener("click", () => { location.hash = r.id; });
    zone.appendChild(tuile);
  }
  $("liste").classList.remove("cache");
  $("detail").classList.add("cache");
}

function afficherRoutine(r) {
  $("d-titre").textContent = `${r.emoji} ${r.titre}`;
  $("d-conseil").textContent = `💡 ${r.conseil}`;
  $("d-entrainer").href = `lecon.html?routine=${r.id}`;
  const dites = phrasesDitesAujourdhui();
  const zone = $("phrases");
  zone.innerHTML = "";
  for (const p of r.phrases) {
    const carte = document.createElement("article");
    carte.className = "carte carte-phrase";
    carte.innerHTML = `
      <div class="cp-haut">
        <span class="cp-emoji">${p.emoji}</span>
        <div>
          <div class="cp-hanzi">${rubyHTML(p.hanzi, p.pinyin)}</div>
          <div class="cp-fr"></div>
        </div>
      </div>
      <div class="cp-actions">
        <button class="bouton-son petit" aria-label="Écouter">🔊</button>
        <button class="bouton-son petit lent" aria-label="Écouter lentement">🐢</button>
        <button class="bouton-dite"></button>
      </div>`;
    carte.querySelector(".cp-fr").textContent = p.fr;
    const [son, lent] = carte.querySelectorAll(".bouton-son");
    son.addEventListener("click", () => prononcer(p.hanzi));
    lent.addEventListener("click", () => prononcer(p.hanzi, 0.45));
    carte.querySelector(".cp-actions").appendChild(boutonsMicro(p.hanzi));

    const dite = carte.querySelector(".bouton-dite");
    const majDite = (fait) => {
      dite.textContent = fait ? "✅ Dite aujourd'hui" : "💬 Je l'ai dite !";
      dite.classList.toggle("fait", fait);
      dite.disabled = fait;
    };
    majDite(dites.has(p.id));
    dite.addEventListener("click", () => { marquerPhraseDite(p.id); majDite(true); });
    zone.appendChild(carte);
  }
  $("liste").classList.add("cache");
  $("detail").classList.remove("cache");
  scrollTo(0, 0);
}

function router() {
  const r = routines.find((x) => x.id === location.hash.slice(1));
  r ? afficherRoutine(r) : afficherListe();
}

$("retour").addEventListener("click", () => { location.hash = ""; });
window.addEventListener("hashchange", router);

if (!profilActif()) {
  location.href = "../index.html";
} else {
  afficherProfilActif();
  activerHorsLigne("../");
  routines = await chargerRoutines("../data/");
  router();
}
