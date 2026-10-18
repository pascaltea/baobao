// Fonctions communes à toutes les pages.

import { profilActif } from "./profils.js";

// Thème visuel selon le profil : sobre pour les adultes, doux et coloré pour les enfants.
export function appliquerTheme() {
  document.documentElement.dataset.theme = profilActif()?.mode ?? "adulte";
}
appliquerTheme();

// Petite vibration sur mobile (bonne réponse, erreur), si l'appareil le permet.
export function vibrer(motif) {
  try { navigator.vibrate?.(motif); } catch { /* pas de vibration */ }
}

// Prononce un texte en chinois avec la synthèse vocale du navigateur.
// `vitesse` : 0.8 par défaut, 0.45 pour le mode « tortue ».
export function prononcer(texte, vitesse = 0.8) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const phrase = new SpeechSynthesisUtterance(texte);
  phrase.lang = "zh-CN";
  phrase.rate = vitesse;
  const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh"));
  if (voix) phrase.voice = voix;
  speechSynthesis.speak(phrase);
}

// Comme prononcer, mais renvoie une promesse résolue à la fin de la lecture.
export function prononcerPuis(texte, vitesse = 0.8) {
  return new Promise((fini) => {
    if (!("speechSynthesis" in window)) return fini();
    speechSynthesis.cancel();
    const phrase = new SpeechSynthesisUtterance(texte);
    phrase.lang = "zh-CN";
    phrase.rate = vitesse;
    const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh"));
    if (voix) phrase.voice = voix;
    const secours = setTimeout(fini, 1500 + texte.length * 600);
    phrase.onend = phrase.onerror = () => { clearTimeout(secours); fini(); };
    speechSynthesis.speak(phrase);
  });
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
