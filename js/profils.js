// Profils et progression, stockés dans le navigateur (localStorage).
// Chaque profil garde : ses XP, sa série de jours, les leçons terminées
// et, pour chaque mot vu, son niveau de répétition espacée (boîtes de Leitner).

const CLE = "mandarin-famille";

// Délai avant la prochaine révision d'un mot, en jours, selon son niveau.
const INTERVALLES = [0, 1, 2, 4, 7, 15, 30];
export const NIVEAU_MAX = INTERVALLES.length - 1;

export function aujourdhui(decalage = 0) {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Complète un profil créé par une ancienne version de l'appli.
function normaliser(p) {
  p.xp ??= 0;
  p.historique ??= {};
  p.serie ??= { jours: 0, dernier: null };
  p.objectif ??= 20;
  p.lecons ??= [];
  p.mode ??= "normal";
  p.mots ??= {};
  if (Array.isArray(p.connus)) {
    for (const id of p.connus) p.mots[id] ??= { niveau: 1, prochaine: aujourdhui() };
    delete p.connus;
  }
  return p;
}

function lireEtat() {
  try {
    const etat = JSON.parse(localStorage.getItem(CLE)) || { profils: [], actif: null };
    etat.profils.forEach(normaliser);
    return etat;
  } catch {
    return { profils: [], actif: null };
  }
}

function ecrireEtat(etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // stockage indisponible (navigation privée…) : on continue sans sauvegarder
  }
}

// Applique une modification au profil actif et l'enregistre.
function modifierActif(modif) {
  const etat = lireEtat();
  const profil = etat.profils.find((p) => p.id === etat.actif);
  if (!profil) return null;
  modif(profil);
  ecrireEtat(etat);
  return profil;
}

export function listerProfils() {
  return lireEtat().profils;
}

export function ajouterProfil(nom, avatar, mode = "normal") {
  const etat = lireEtat();
  const profil = normaliser({ id: Date.now().toString(36), nom, avatar, mode });
  etat.profils.push(profil);
  etat.actif = profil.id;
  ecrireEtat(etat);
  return profil;
}

export function supprimerProfil(id) {
  const etat = lireEtat();
  etat.profils = etat.profils.filter((p) => p.id !== id);
  if (etat.actif === id) etat.actif = etat.profils[0]?.id ?? null;
  ecrireEtat(etat);
}

export function choisirProfil(id) {
  const etat = lireEtat();
  etat.actif = id;
  ecrireEtat(etat);
}

export function profilActif() {
  const etat = lireEtat();
  return etat.profils.find((p) => p.id === etat.actif) || null;
}

export function changerMode(mode) {
  modifierActif((p) => { p.mode = mode; });
}

// ---------- Mots et répétition espacée ----------

export function motsConnus() {
  return new Set(Object.keys(profilActif()?.mots ?? {}));
}

export function niveauMot(id) {
  return profilActif()?.mots[id]?.niveau ?? 0;
}

// Bonne réponse : le mot monte d'un niveau et reviendra plus tard.
// Erreur : il retombe au niveau 1 et reviendra dès demain.
export function enregistrerReponse(id, juste) {
  modifierActif((p) => {
    const mot = p.mots[id] ?? { niveau: 0 };
    mot.niveau = juste ? Math.min(NIVEAU_MAX, mot.niveau + 1) : 1;
    mot.prochaine = aujourdhui(INTERVALLES[mot.niveau]);
    p.mots[id] = mot;
  });
}

// Compatibilité avec les flashcards : « Je sais » / « À revoir ».
export function marquerMot(id, connu) {
  enregistrerReponse(id, connu);
}

export function motsARevoir() {
  const mots = profilActif()?.mots ?? {};
  const date = aujourdhui();
  return Object.keys(mots).filter((id) => mots[id].prochaine <= date);
}

// ---------- Leçons ----------

export function leconsTerminees() {
  return new Set(profilActif()?.lecons ?? []);
}

export function terminerLecon(cle) {
  modifierActif((p) => {
    if (!p.lecons.includes(cle)) p.lecons.push(cle);
  });
}

// ---------- XP, série et objectif du jour ----------

export function ajouterXP(points) {
  return modifierActif((p) => {
    const date = aujourdhui();
    p.xp += points;
    p.historique[date] = (p.historique[date] ?? 0) + points;
    if (p.serie.dernier !== date) {
      p.serie.jours = p.serie.dernier === aujourdhui(-1) ? p.serie.jours + 1 : 1;
      p.serie.dernier = date;
    }
    // On ne garde que les 60 derniers jours d'historique.
    const limite = aujourdhui(-60);
    for (const jour of Object.keys(p.historique)) if (jour < limite) delete p.historique[jour];
  });
}

export function statistiques(p = profilActif()) {
  if (!p) return null;
  const serieEnCours = p.serie.dernier === aujourdhui() || p.serie.dernier === aujourdhui(-1);
  let xpSemaine = 0;
  for (let i = 0; i < 7; i++) xpSemaine += p.historique[aujourdhui(-i)] ?? 0;
  return {
    xp: p.xp,
    xpJour: p.historique[aujourdhui()] ?? 0,
    objectif: p.objectif,
    serie: serieEnCours ? p.serie.jours : 0,
    xpSemaine,
    nbMots: Object.keys(p.mots).length,
  };
}
