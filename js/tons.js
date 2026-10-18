// Exercice des tons : on entend une syllabe, on choisit son ton (1 à 4).
// Chaque série de data/tons.json contient 4 mots, rangés du 1er au 4e ton.

import { chargerJSON, prononcer, afficherProfilActif, activerHorsLigne } from "./app.js";
import { ajouterXP } from "./profils.js";

const NB_QUESTIONS = 10;
const $ = (id) => document.getElementById(id);
const boutons = [...document.querySelectorAll("#choix button")];

let series = [];
let numero = 0;
let points = 0;
let courant = null; // { mot, ton }
let repondu = false;

function nouvelleQuestion() {
  numero++;
  repondu = false;
  const serie = series[Math.floor(Math.random() * series.length)];
  const ton = Math.floor(Math.random() * 4);
  courant = { mot: serie[ton], ton };
  for (const b of boutons) { b.disabled = false; b.classList.remove("bon", "faux"); }
  $("retour").innerHTML = "";
  $("suivant").classList.add("cache");
  $("score").textContent = `Question ${numero} / ${NB_QUESTIONS} · ⭐ ${points}`;
  setTimeout(() => prononcer(courant.mot.hanzi), 300);
}

function repondre(ton) {
  if (repondu) return;
  repondu = true;
  const juste = ton === courant.ton;
  if (juste) points++;
  for (const b of boutons) {
    b.disabled = true;
    const t = Number(b.dataset.ton);
    if (t === courant.ton) b.classList.add("bon");
    else if (t === ton) b.classList.add("faux");
  }
  const { hanzi, pinyin, fr } = courant.mot;
  $("retour").innerHTML = `<span class="${juste ? "ok" : "ko"}">${juste ? "Bravo ! 👏" : "Presque !"}</span><br>${hanzi} <strong>${pinyin}</strong> = ${fr}`;
  $("score").textContent = `Question ${numero} / ${NB_QUESTIONS} · ⭐ ${points}`;
  $("suivant").textContent = numero < NB_QUESTIONS ? "Suivant →" : "Voir mon score";
  $("suivant").classList.remove("cache");
}

function terminer() {
  $("jeu").classList.add("cache");
  $("fin").classList.remove("cache");
  const super_ = points >= 8;
  $("fin-emoji").textContent = super_ ? "🏆" : points >= 5 ? "🎉" : "💪";
  $("fin-titre").textContent = super_ ? "太棒了 (tài bàng le) !" : points >= 5 ? "Bien joué !" : "Continue, tu progresses !";
  $("bilan").textContent = `Tu as reconnu ${points} ton(s) sur ${NB_QUESTIONS} · ⭐ +${points} XP`;
  ajouterXP(points);
}

function demarrer() {
  numero = 0;
  points = 0;
  $("fin").classList.add("cache");
  $("jeu").classList.remove("cache");
  nouvelleQuestion();
}

for (const b of boutons) b.addEventListener("click", () => repondre(Number(b.dataset.ton)));
$("ecouter").addEventListener("click", () => courant && prononcer(courant.mot.hanzi));
$("suivant").addEventListener("click", () => (numero < NB_QUESTIONS ? nouvelleQuestion() : terminer()));
$("recommencer").addEventListener("click", demarrer);

afficherProfilActif();
activerHorsLigne("../");
series = await chargerJSON("../data/tons.json");
demarrer();
