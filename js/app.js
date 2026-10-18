// Fonctions communes à toutes les pages.

import { profilActif } from "./profils.js";

// Prononce un texte en chinois avec la synthèse vocale du navigateur.
export function prononcer(texte) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const phrase = new SpeechSynthesisUtterance(texte);
  phrase.lang = "zh-CN";
  phrase.rate = 0.8;
  const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh"));
  if (voix) phrase.voice = voix;
  speechSynthesis.speak(phrase);
}

// Charge un fichier JSON de data/ (chemin relatif à la page courante).
export async function chargerJSON(chemin) {
  const reponse = await fetch(chemin);
  if (!reponse.ok) throw new Error(`Impossible de charger ${chemin}`);
  return reponse.json();
}

// Charge tous les thèmes de vocabulaire et renvoie la liste complète des mots.
export async function chargerTousLesMots(dossier) {
  const themes = await chargerJSON(`${dossier}index.json`);
  const listes = await Promise.all(themes.map((t) => chargerJSON(dossier + t.fichier)));
  return listes.flatMap((liste, i) => liste.map((m) => ({ ...m, theme: themes[i].id })));
}

export function melanger(liste) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// Affiche le profil actif dans l'en-tête (élément .profil-actif).
export function afficherProfilActif() {
  const zone = document.querySelector(".profil-actif");
  if (!zone) return;
  const profil = profilActif();
  zone.textContent = profil ? `${profil.avatar} ${profil.nom}` : "";
}

// Active le mode hors-ligne (service worker à la racine du site).
export function activerHorsLigne(racine = "./") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(`${racine}service-worker.js`).catch(() => {});
  }
}
