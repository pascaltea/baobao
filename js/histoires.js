// Histoires courtes, page par page, puis une question de compréhension.
// La traduction est cachée par défaut : on essaie d'abord de comprendre.

import { chargerJSON, prononcer, afficherProfilActif, activerHorsLigne, vibrer } from "./app.js";
import { rubyHTML } from "./pinyin.js";
import { mascotte } from "./mascotte.js";
import { gagnerXP, evenement } from "./gamification.js";
import { sonJuste, sonFaux } from "./sons.js";

const $ = (id) => document.getElementById(id);
let histoires = [];
let histoire = null;
let page = 0;

function montrer(section) {
  for (const id of ["liste", "lecteur", "question"]) $(id).classList.toggle("cache", id !== section);
  scrollTo(0, 0);
}

function afficherListe() {
  const zone = $("histoires");
  zone.innerHTML = "";
  for (const h of histoires) {
    const tuile = document.createElement("button");
    tuile.className = "tuile";
    tuile.innerHTML = `<span class="grand">${h.emoji}</span><strong>${h.chinois}</strong><br><small>${h.titre} · ${h.niveau}</small>`;
    tuile.addEventListener("click", () => { location.hash = h.id; });
    zone.appendChild(tuile);
  }
  montrer("liste");
}

function afficherPage() {
  const p = histoire.pages[page];
  $("ph-emoji").textContent = p.emoji;
  $("ph-hanzi").innerHTML = $("voir-pinyin").checked ? rubyHTML(p.hanzi, p.pinyin) : p.hanzi;
  $("ph-fr").textContent = p.fr;
  $("ph-fr").classList.add("cache");
  $("traduire").classList.remove("cache");
  $("position").textContent = `${page + 1} / ${histoire.pages.length}`;
  $("barre").style.width = `${((page + 1) / histoire.pages.length) * 100}%`;
  $("precedent").disabled = page === 0;
  const article = $("page");
  article.classList.remove("apparition");
  void article.offsetWidth;
  article.classList.add("apparition");
  prononcer(p.hanzi, 0.75);
}

function ouvrir(h) {
  histoire = h;
  page = 0;
  montrer("lecteur");
  afficherPage();
}

function poserQuestion() {
  const q = histoire.question;
  $("q-mascotte").innerHTML = mascotte("parle", "respire");
  $("q-texte").textContent = q.texte;
  $("q-fin").classList.add("cache");
  const zone = $("q-options");
  zone.innerHTML = "";
  q.options.forEach((texte, i) => {
    const b = document.createElement("button");
    b.textContent = texte;
    b.addEventListener("click", () => {
      for (const x of zone.children) x.disabled = true;
      zone.children[q.bonne].classList.add("bon");
      const juste = i === q.bonne;
      if (!juste) b.classList.add("faux");
      juste ? sonJuste() : sonFaux();
      vibrer(juste ? 25 : [40, 60, 40]);
      $("q-mascotte").innerHTML = mascotte(juste ? "bravo" : "oups", juste ? "saute" : "penche");
      const xp = juste ? 10 : 5;
      gagnerXP(xp);
      evenement("histoire");
      $("q-resultat").textContent = juste ? `Bravo, tu as tout compris ! ⭐ +${xp} XP` : `Ce n'est pas grave, relis l'histoire ! ⭐ +${xp} XP`;
      $("q-fin").classList.remove("cache");
    });
    zone.appendChild(b);
  });
  montrer("question");
}

$("suivant").addEventListener("click", () => {
  if (page < histoire.pages.length - 1) { page++; afficherPage(); } else poserQuestion();
});
$("precedent").addEventListener("click", () => { if (page > 0) { page--; afficherPage(); } });
$("son").addEventListener("click", () => prononcer(histoire.pages[page].hanzi, 0.75));
$("lent").addEventListener("click", () => prononcer(histoire.pages[page].hanzi, 0.45));
$("traduire").addEventListener("click", () => { $("ph-fr").classList.remove("cache"); $("traduire").classList.add("cache"); });
$("voir-pinyin").addEventListener("change", () => {
  const p = histoire.pages[page];
  $("ph-hanzi").innerHTML = $("voir-pinyin").checked ? rubyHTML(p.hanzi, p.pinyin) : p.hanzi;
});
$("retour").addEventListener("click", () => { location.hash = ""; });
$("autre").addEventListener("click", () => { location.hash = ""; });
$("relire").addEventListener("click", () => ouvrir(histoire));

function router() {
  const h = histoires.find((x) => x.id === location.hash.slice(1));
  h ? ouvrir(h) : afficherListe();
}
window.addEventListener("hashchange", router);

afficherProfilActif();
activerHorsLigne("../");
histoires = await chargerJSON("../data/histoires.json");
router();
