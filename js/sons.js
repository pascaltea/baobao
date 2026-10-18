// Petits sons de jeu générés par le navigateur (aucun fichier audio nécessaire).

let contexte = null;

function jouer(frequences, duree = 0.12, forme = "sine", volume = 0.12) {
  try {
    contexte ??= new (window.AudioContext || window.webkitAudioContext)();
    frequences.forEach((freq, i) => {
      const osc = contexte.createOscillator();
      const gain = contexte.createGain();
      const debut = contexte.currentTime + i * duree;
      osc.type = forme;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, debut);
      gain.gain.exponentialRampToValueAtTime(0.001, debut + duree * 1.6);
      osc.connect(gain).connect(contexte.destination);
      osc.start(debut);
      osc.stop(debut + duree * 1.7);
    });
  } catch {
    // pas de son disponible : tant pis
  }
}

export const sonJuste = () => jouer([660, 990]);
export const sonFaux = () => jouer([240, 190], 0.16, "triangle");
export const sonVictoire = () => jouer([523, 659, 784, 1047], 0.13);
