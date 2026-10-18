// Quiz à 4 choix, deux sortes de questions mélangées :
//  - on voit (et entend) le caractère → on choisit la traduction
//  - on voit l'emoji et le mot français → on choisit le caractère
// Le quiz porte uniquement sur les mots déjà découverts dans les leçons.

import { chargerJSON, chargerTousLesMots, prononcer, melanger, afficherProfilActif, activerHorsLigne } from "./app.js";
import { profilActif, enregistrerReponse, motsConnus } from "./profils.js";
import { gagnerXP, evenement } from "./gamification.js";

const DATA = "../data/vocabulaire/";
const NB_QUESTIONS = 10;
const $ = (id) => document.getElementById(id);

let dictionnaire = []; // tous les mots de l'appli
let tousLesMots = [];  // les mots déjà découverts par le profil
let themeChoisi = null; // null = tous les thèmes
let questions = [];
let numero = 0;
let points = 0;
let repondu = false;

function montrer(section) {
  for (const id of ["choix-theme", "jeu", "fin"]) $(id).classList.toggle("cache", id !== section);
}

async function afficherThemes() {
  const themes = await chargerJSON(`${DATA}index.json`);
  const zone = $("themes");
  zone.innerHTML = "";
  const tuile = (emoji, titre, id, nb) => {
    const ouvert = nb >= 4;
    const b = document.createElement("button");
    b.className = "tuile" + (ouvert ? "" : " verrouille");
    b.innerHTML = `<span class="grand">${ouvert ? emoji : "🔒"}</span><strong>${titre}</strong><br><small>${nb} mot(s) appris</small>`;
    if (ouvert) b.addEventListener("click", () => demarrer(id));
    else b.disabled = true;
    zone.appendChild(b);
  };
  tuile("🌈", "Tous mes mots", null, tousLesMots.length);
  for (const t of themes) tuile(t.emoji, t.titre, t.id, tousLesMots.filter((m) => m.theme === t.id).length);
  $("aide-quiz").classList.toggle("cache", tousLesMots.length >= 4);
  montrer("choix-theme");
}

function demarrer(theme) {
  themeChoisi = theme;
  const pool = theme ? tousLesMots.filter((m) => m.theme === theme) : tousLesMots;
  questions = melanger(pool).slice(0, NB_QUESTIONS).map((mot) => ({
    mot,
    sens: Math.random() < 0.5 ? "hanzi-vers-fr" : "fr-vers-hanzi",
    // Les mauvaises réponses viennent du même thème si possible (plus de 3 mots).
    leurres: melanger(
      (pool.length >= 4 ? pool : dictionnaire).filter((m) => m.id !== mot.id && m.fr !== mot.fr)
    ).slice(0, 3),
  }));
  numero = 0;
  points = 0;
  montrer("jeu");
  afficherQuestion();
}

function afficherQuestion() {
  const { mot, sens, leurres } = questions[numero];
  repondu = false;
  $("score").textContent = `Question ${numero + 1} / ${questions.length} · ⭐ ${points}`;
  $("retour").innerHTML = "";
  $("suivant").classList.add("cache");

  const q = $("question");
  if (sens === "hanzi-vers-fr") {
    q.innerHTML = `<p class="consigne">Que veut dire…</p><div class="grand-hanzi"></div>
      <button class="bouton secondaire" id="ecouter">🔊 Écouter</button>`;
    q.querySelector(".grand-hanzi").textContent = mot.hanzi;
    q.querySelector("#ecouter").addEventListener("click", () => prononcer(mot.hanzi));
    prononcer(mot.hanzi);
  } else {
    q.innerHTML = `<p class="consigne">Comment dit-on en chinois…</p><div class="grand-emoji"></div><p class="fr" style="font-size:1.4rem"></p>`;
    q.querySelector(".grand-emoji").textContent = mot.emoji || "";
    q.querySelector(".fr").textContent = mot.fr;
  }

  const zone = $("choix");
  zone.innerHTML = "";
  for (const option of melanger([mot, ...leurres])) {
    const b = document.createElement("button");
    if (sens === "hanzi-vers-fr") {
      b.textContent = option.fr;
    } else {
      b.className = "hanzi-choix";
      b.textContent = option.hanzi;
    }
    b.dataset.id = option.id;
    b.addEventListener("click", () => repondre(option, b));
    zone.appendChild(b);
  }
}

function repondre(option, bouton) {
  if (repondu) return;
  repondu = true;
  const { mot } = questions[numero];
  const juste = option.id === mot.id;
  if (juste) points++;
  enregistrerReponse(mot.id, juste);
  for (const b of $("choix").children) {
    b.disabled = true;
    if (b.dataset.id === mot.id) b.classList.add("bon");
  }
  if (!juste) bouton.classList.add("faux");
  $("retour").innerHTML = `<span class="${juste ? "ok" : "ko"}">${juste ? "Bravo ! 👏" : "Pas tout à fait…"}</span><br>`;
  $("retour").append(`${mot.emoji || ""} ${mot.hanzi} ${mot.pinyin} = ${mot.fr}`);
  prononcer(mot.hanzi);
  $("score").textContent = `Question ${numero + 1} / ${questions.length} · ⭐ ${points}`;
  $("suivant").textContent = numero + 1 < questions.length ? "Suivant →" : "Voir mon score";
  $("suivant").classList.remove("cache");
}

function terminer() {
  const total = questions.length;
  const ratio = points / total;
  $("fin-emoji").textContent = ratio >= 0.8 ? "🏆" : ratio >= 0.5 ? "🎉" : "💪";
  $("fin-titre").textContent = ratio >= 0.8 ? "太棒了 (tài bàng le) !" : ratio >= 0.5 ? "Bien joué !" : "Continue, tu progresses !";
  $("bilan").textContent = `${points} bonne(s) réponse(s) sur ${total} · ⭐ +${points} XP`;
  gagnerXP(points);
  evenement("quiz", { justes: points });
  montrer("fin");
}

$("suivant").addEventListener("click", () => {
  numero++;
  numero < questions.length ? afficherQuestion() : terminer();
});
$("recommencer").addEventListener("click", () => demarrer(themeChoisi));
$("changer").addEventListener("click", afficherThemes);

if (!profilActif()) {
  location.href = "../index.html";
} else {
  afficherProfilActif();
  activerHorsLigne("../");
  dictionnaire = await chargerTousLesMots(DATA);
  const connus = motsConnus();
  tousLesMots = dictionnaire.filter((m) => connus.has(m.id));
  afficherThemes();
}
