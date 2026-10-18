// « Répète et compare » : on s'enregistre, puis on entend le modèle suivi de sa
// propre voix. Plus honnête qu'une reconnaissance vocale qui accepte tout :
// c'est l'oreille qui juge, et on entend vraiment ses tons.

import { prononcerPuis } from "./app.js";

const DUREE_MAX = 5000;

export function microDisponible() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

// Crée les boutons 🎙️ (s'enregistrer) et 🎧 (comparer) pour un texte chinois.
export function boutonsMicro(texte) {
  const zone = document.createElement("div");
  zone.className = "micro";
  if (!microDisponible()) return zone;
  zone.innerHTML = `
    <button class="bouton-micro" type="button">🎙️ Je répète</button>
    <button class="bouton-comparer cache" type="button">🎧 Comparer</button>
    <span class="micro-aide"></span>`;
  const [enregistrer, comparer] = zone.querySelectorAll("button");
  const aide = zone.querySelector(".micro-aide");
  let enregistreur = null;
  let maVoix = null;

  const ecouterComparaison = async () => {
    aide.textContent = "Modèle…";
    await prononcerPuis(texte);
    aide.textContent = "Ta voix…";
    await new Promise((fini) => {
      const audio = new Audio(maVoix);
      audio.onended = audio.onerror = fini;
      audio.play().catch(fini);
    });
    aide.textContent = "Même mélodie ? Bravo ! Sinon, réessaie 🙂";
  };

  enregistrer.addEventListener("click", async () => {
    if (enregistreur?.state === "recording") { enregistreur.stop(); return; }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const morceaux = [];
      enregistreur = new MediaRecorder(flux);
      enregistreur.ondataavailable = (e) => morceaux.push(e.data);
      enregistreur.onstop = () => {
        flux.getTracks().forEach((t) => t.stop());
        if (maVoix) URL.revokeObjectURL(maVoix);
        maVoix = URL.createObjectURL(new Blob(morceaux, { type: enregistreur.mimeType }));
        enregistrer.textContent = "🎙️ Recommencer";
        enregistrer.classList.remove("enregistre");
        comparer.classList.remove("cache");
        ecouterComparaison();
      };
      enregistreur.start();
      enregistrer.textContent = "⏹️ Stop";
      enregistrer.classList.add("enregistre");
      aide.textContent = "Parle maintenant !";
      setTimeout(() => { if (enregistreur?.state === "recording") enregistreur.stop(); }, DUREE_MAX);
    } catch {
      aide.textContent = "Micro non autorisé : vérifie les réglages du navigateur.";
    }
  });
  comparer.addEventListener("click", () => maVoix && ecouterComparaison());
  return zone;
}
