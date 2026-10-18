// Profils et progression, stockés dans le navigateur (localStorage).
// Chaque profil garde la liste des mots qu'il connaît.

const CLE = "mandarin-famille";

function lireEtat() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || { profils: [], actif: null };
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

export function listerProfils() {
  return lireEtat().profils;
}

export function ajouterProfil(nom, avatar) {
  const etat = lireEtat();
  const profil = { id: Date.now().toString(36), nom, avatar, connus: [] };
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

export function marquerMot(idMot, connu) {
  const etat = lireEtat();
  const profil = etat.profils.find((p) => p.id === etat.actif);
  if (!profil) return;
  const connus = new Set(profil.connus);
  connu ? connus.add(idMot) : connus.delete(idMot);
  profil.connus = [...connus];
  ecrireEtat(etat);
}

export function motsConnus() {
  return new Set(profilActif()?.connus ?? []);
}
