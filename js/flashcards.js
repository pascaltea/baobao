// Flashcards : on montre le caractère, l'enfant devine, puis retourne la carte.
// Les mots « à revoir » reviennent en fin de paquet jusqu'à ce qu'ils soient sus.

import { chargerJSON, prononcer, melanger, afficherProfilActif, activerHorsLigne } from "./app.js";
import { profilActif, marquerMot, motsConnus, ajouterXP } from "./profils.js";

const DATA = "../data/vocabulaire/";
const $ = (id) => document.getElementById(id);

let theme = null;
let mots = [];
let paquet = [];
let courant = null;
let retournee = false;

function montrer(section) {
  for (const id of ["choix-theme", "session", "fin"]) $(id).classList.toggle("cache", id !== section);
}

async function afficherThemes() {
  const themes = await chargerJSON(`${DATA}index.json`);
  const connus = motsConnus();
  const zone = $("themes");
  zone.innerHTML = "";
  for (const t of themes) {
    const liste = await chargerJSON(DATA + t.fichier);
    const appris = liste.filter((m) => connus.has(m.id)).length;
    const tuile = document.createElement("button");
    tuile.className = "tuile";
    tuile.innerHTML = `<span class="grand">${t.emoji}</span><strong>${t.titre}</strong><br><small>${appris} / ${liste.length}</small>`;
    tuile.addEventListener("click", () => demarrer(t, liste));
    zone.appendChild(tuile);
  }
  montrer("choix-theme");
}

function demarrer(t, liste) {
  theme = t;
  mots = liste;
  // Les mots pas encore connus d'abord, puis les autres pour réviser.
  const connus = motsConnus();
  paquet = [...melanger(liste.filter((m) => !connus.has(m.id))), ...melanger(liste.filter((m) => connus.has(m.id)))];
  montrer("session");
  suivante();
}

function suivante() {
  if (paquet.length === 0) return terminer();
  courant = paquet.shift();
  retournee = false;
  $("hanzi").textContent = courant.hanzi;
  $("hanzi-verso").textContent = courant.hanzi;
  $("emoji").textContent = courant.emoji || "";
  $("pinyin").textContent = courant.pinyin;
  $("fr").textContent = courant.fr;
  $("recto").classList.remove("cache");
  $("verso").classList.add("cache");
  $("reponse").classList.add("cache");
  majProgression();
}

function retourner() {
  if (retournee) return;
  retournee = true;
  $("recto").classList.add("cache");
  $("verso").classList.remove("cache");
  $("reponse").classList.remove("cache");
  prononcer(courant.hanzi);
}

function repondre(connu) {
  marquerMot(courant.id, connu);
  if (!connu) paquet.push(courant);
  suivante();
}

function majProgression() {
  const connus = motsConnus();
  const appris = mots.filter((m) => connus.has(m.id)).length;
  $("progression").textContent = `${theme.emoji} ${theme.titre} · ${appris} / ${mots.length} mots appris`;
  $("barre").style.width = `${(appris / mots.length) * 100}%`;
}

function terminer() {
  const connus = motsConnus();
  const appris = mots.filter((m) => connus.has(m.id)).length;
  $("bilan").textContent = `Tu connais ${appris} mot(s) sur ${mots.length} dans « ${theme.titre} » · ⭐ +5 XP`;
  ajouterXP(5);
  montrer("fin");
}

$("carte").addEventListener("click", retourner);
$("carte").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); retourner(); }
});
$("ecouter").addEventListener("click", () => courant && prononcer(courant.hanzi));
$("connu").addEventListener("click", () => repondre(true));
$("revoir").addEventListener("click", () => repondre(false));
$("changer").addEventListener("click", afficherThemes);
$("recommencer").addEventListener("click", () => demarrer(theme, mots));

if (!profilActif()) {
  location.href = "../index.html";
} else {
  afficherProfilActif();
  afficherThemes();
  activerHorsLigne("../");
}
