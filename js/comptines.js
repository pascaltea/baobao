// Comptines traditionnelles : paroles avec pinyin et traduction, écoute ligne par ligne.
// La synthèse vocale lit les paroles (elle ne chante pas) : l'air est indiqué pour chanter soi-même.

import { chargerJSON, prononcer, prononcerPuis, afficherProfilActif, activerHorsLigne } from "./app.js";
import { rubyHTML } from "./pinyin.js";

const $ = (id) => document.getElementById(id);
let comptines = [];
let lectureEnCours = 0; // permet d'interrompre « Tout écouter »

function afficherListe() {
  const zone = $("comptines");
  zone.innerHTML = "";
  for (const c of comptines) {
    const tuile = document.createElement("button");
    tuile.className = "tuile";
    tuile.innerHTML = `<span class="grand">${c.emoji}</span><strong>${c.chinois}</strong><br><small>${c.titre}</small>`;
    tuile.addEventListener("click", () => { location.hash = c.id; });
    zone.appendChild(tuile);
  }
  $("liste").classList.remove("cache");
  $("detail").classList.add("cache");
}

function afficherComptine(c) {
  $("d-titre").textContent = `${c.emoji} ${c.chinois} · ${c.titre}`;
  $("d-air").textContent = `🎵 ${c.air}`;
  const zone = $("lignes");
  zone.innerHTML = "";
  c.lignes.forEach((ligne) => {
    const li = document.createElement("li");
    li.innerHTML = `<button class="ligne-comptine"><span class="lc-hanzi">${rubyHTML(ligne.hanzi, ligne.pinyin)}</span><span class="lc-fr"></span></button>`;
    li.querySelector(".lc-fr").textContent = ligne.fr;
    li.querySelector("button").addEventListener("click", () => { lectureEnCours++; prononcer(ligne.hanzi, 0.7); });
    zone.appendChild(li);
  });
  $("tout").onclick = async () => {
    const moi = ++lectureEnCours;
    const elements = [...zone.querySelectorAll(".ligne-comptine")];
    for (const [i, ligne] of c.lignes.entries()) {
      if (moi !== lectureEnCours) break;
      elements.forEach((e, j) => e.classList.toggle("en-cours", j === i));
      await prononcerPuis(ligne.hanzi, 0.7);
    }
    elements.forEach((e) => e.classList.remove("en-cours"));
  };
  $("liste").classList.add("cache");
  $("detail").classList.remove("cache");
  scrollTo(0, 0);
}

function router() {
  lectureEnCours++;
  const c = comptines.find((x) => x.id === location.hash.slice(1));
  c ? afficherComptine(c) : afficherListe();
}

$("retour").addEventListener("click", () => { location.hash = ""; });
window.addEventListener("hashchange", router);

afficherProfilActif();
activerHorsLigne("../");
comptines = await chargerJSON("../data/comptines.json");
router();
