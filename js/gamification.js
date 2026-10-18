// Gamification : niveaux (les 12 animaux du zodiaque chinois), quêtes du jour
// avec coffre, badges et notifications. Tout passe par evenement() et gagnerXP().
//
// Principes retenus (contrairement aux applis qui misent sur la pression) :
// récompenser l'effort et l'usage réel, jamais punir ; objectifs courts et clairs.

import { modifierActif, profilActif, ajouterXP, statistiques, aujourdhui } from "./profils.js";
import { sonVictoire } from "./sons.js";

// ---------- Niveaux : le zodiaque chinois ----------

export const NIVEAUX = [
  { emoji: "🐭", hanzi: "鼠", pinyin: "shǔ", nom: "Rat" },
  { emoji: "🐮", hanzi: "牛", pinyin: "niú", nom: "Bœuf" },
  { emoji: "🐯", hanzi: "虎", pinyin: "hǔ", nom: "Tigre" },
  { emoji: "🐰", hanzi: "兔", pinyin: "tù", nom: "Lapin" },
  { emoji: "🐲", hanzi: "龙", pinyin: "lóng", nom: "Dragon" },
  { emoji: "🐍", hanzi: "蛇", pinyin: "shé", nom: "Serpent" },
  { emoji: "🐴", hanzi: "马", pinyin: "mǎ", nom: "Cheval" },
  { emoji: "🐐", hanzi: "羊", pinyin: "yáng", nom: "Chèvre" },
  { emoji: "🐵", hanzi: "猴", pinyin: "hóu", nom: "Singe" },
  { emoji: "🐔", hanzi: "鸡", pinyin: "jī", nom: "Coq" },
  { emoji: "🐶", hanzi: "狗", pinyin: "gǒu", nom: "Chien" },
  { emoji: "🐷", hanzi: "猪", pinyin: "zhū", nom: "Cochon" },
  { emoji: "🏮", hanzi: "大师", pinyin: "dàshī", nom: "Grand maître" },
];

// XP nécessaires pour atteindre le niveau n (0 pour le premier) : 0, 30, 90, 180, 300…
const seuil = (n) => 15 * n * (n + 1);

export function niveauPour(xp) {
  let n = 0;
  while (n < NIVEAUX.length - 1 && xp >= seuil(n + 1)) n++;
  const max = n === NIVEAUX.length - 1;
  return {
    numero: n + 1,
    ...NIVEAUX[n],
    xpDansNiveau: xp - seuil(n),
    xpPourSuivant: max ? 0 : seuil(n + 1) - seuil(n),
    progression: max ? 1 : (xp - seuil(n)) / (seuil(n + 1) - seuil(n)),
    suivant: max ? null : NIVEAUX[n + 1],
  };
}

// ---------- Quêtes du jour ----------

const QUETES = {
  lecon: { emoji: "📘", texte: "Termine une leçon", objectif: 1 },
  phrase: { emoji: "💬", texte: "Dis une phrase à tes enfants", objectif: 1 },
  justes: { emoji: "🎯", texte: "Donne 15 bonnes réponses", objectif: 15 },
  revision: { emoji: "🧠", texte: "Fais une révision", objectif: 1 },
  combo: { emoji: "🔥", texte: "Réussis 5 réponses d'affilée", objectif: 5 },
  tons: { emoji: "🎵", texte: "Joue aux 4 tons", objectif: 1 },
  xp: { emoji: "⭐", texte: "Gagne 30 XP", objectif: 30 },
  imagier: { emoji: "🖼️", texte: "Regarde l'imagier", objectif: 1 },
  comptine: { emoji: "🎶", texte: "Écoute une comptine", objectif: 1 },
  justesEnfant: { emoji: "🌟", texte: "Trouve 10 bonnes réponses", objectif: 10 },
  histoire: { emoji: "📚", texte: "Lis une histoire", objectif: 1 },
};

// Adultes : toujours apprendre + parler aux enfants, plus une quête variée.
const TIRAGES = {
  adulte: { fixes: ["lecon", "phrase"], variees: ["justes", "revision", "combo", "tons", "xp", "comptine", "histoire"] },
  enfant: { fixes: ["lecon"], variees: ["imagier", "comptine", "justesEnfant", "tons", "histoire"] },
};

function tirerQuetes(mode) {
  const tirage = TIRAGES[mode];
  if (!tirage) return [];
  // Tirage stable pour la journée (même résultat à chaque ouverture).
  const graine = [...aujourdhui()].reduce((t, c) => t * 31 + c.charCodeAt(0), 7);
  const variees = [...tirage.variees];
  const choisies = [...tirage.fixes];
  let g = Math.abs(graine);
  while (choisies.length < 3 && variees.length) {
    choisies.push(variees.splice(g % variees.length, 1)[0]);
    g = Math.floor(g / 7) + 13;
  }
  return choisies.map((id) => ({ id, progres: 0, objectif: QUETES[id].objectif }));
}

export function quetesDuJour() {
  const p = profilActif();
  if (!p || !TIRAGES[p.mode]) return null;
  if (p.quetes?.date !== aujourdhui()) {
    modifierActif((profil) => { profil.quetes = { date: aujourdhui(), liste: tirerQuetes(profil.mode), coffre: false }; });
  }
  const q = profilActif().quetes;
  return {
    ...q,
    liste: q.liste.map((x) => ({ ...x, ...QUETES[x.id], objectif: x.objectif, fait: x.progres >= x.objectif })),
    toutesFaites: q.liste.every((x) => x.progres >= x.objectif),
  };
}

function avancerQuete(id, valeur, mode = "ajout") {
  const finies = [];
  modifierActif((p) => {
    if (p.quetes?.date !== aujourdhui()) p.quetes = { date: aujourdhui(), liste: tirerQuetes(p.mode), coffre: false };
    for (const q of p.quetes.liste) {
      if (q.id !== id || q.progres >= q.objectif) continue;
      q.progres = mode === "max" ? Math.max(q.progres, valeur) : q.progres + valeur;
      if (q.progres >= q.objectif) finies.push({ ...QUETES[id] });
    }
  });
  for (const q of finies) toast("🎯", "Quête réussie !", `${q.emoji} ${q.texte}`);
}

// Le coffre s'ouvre quand les 3 quêtes du jour sont réussies.
export function ouvrirCoffre() {
  const q = quetesDuJour();
  if (!q?.toutesFaites || q.coffre) return null;
  modifierActif((p) => { p.quetes.coffre = true; });
  compter("coffres");
  const gain = 15;
  gagnerXP(gain);
  verifierBadges();
  return gain;
}

// ---------- Badges ----------

export const BADGES = [
  { id: "premiere-lecon", emoji: "🌱", titre: "Premiers pas", texte: "Terminer une première leçon", test: (p) => p.lecons.length >= 1 },
  { id: "cinq-lecons", emoji: "📚", titre: "Bon élève", texte: "Terminer 5 leçons", test: (p) => p.lecons.length >= 5 },
  { id: "unite", emoji: "🏅", titre: "Unité réussie", texte: "Terminer la révision d'une unité", test: (p) => p.lecons.some((l) => l.endsWith(":revision")) },
  { id: "serie3", emoji: "🔥", titre: "Bien lancé", texte: "Une série de 3 jours", test: (p, s) => s.serie >= 3 },
  { id: "serie7", emoji: "⚡", titre: "Une semaine !", texte: "Une série de 7 jours", test: (p, s) => s.serie >= 7 },
  { id: "serie30", emoji: "👑", titre: "Inarrêtable", texte: "Une série de 30 jours", test: (p, s) => s.serie >= 30 },
  { id: "mots25", emoji: "🧠", titre: "Petite mémoire", texte: "Apprendre 25 mots ou phrases", test: (p, s) => s.nbMots >= 25 },
  { id: "mots100", emoji: "🎓", titre: "Grande mémoire", texte: "Apprendre 100 mots ou phrases", test: (p, s) => s.nbMots >= 100 },
  { id: "parfait", emoji: "⭐", titre: "Sans faute", texte: "Une leçon sans aucune erreur", test: (p) => (p.compteurs.parfaits ?? 0) >= 1 },
  { id: "combo10", emoji: "🎯", titre: "En feu", texte: "10 bonnes réponses d'affilée", test: (p) => (p.compteurs.meilleurCombo ?? 0) >= 10 },
  { id: "tons", emoji: "🎵", titre: "Oreille d'or", texte: "8 tons sur 10 reconnus", test: (p) => (p.compteurs.meilleurTons ?? 0) >= 8 },
  { id: "parent", emoji: "💬", titre: "Parent bilingue", texte: "Dire 10 phrases à ses enfants", test: (p) => (p.compteurs.dites ?? 0) >= 10 },
  { id: "chanteur", emoji: "🎶", titre: "Rossignol", texte: "Écouter une comptine en entier", test: (p) => (p.compteurs.comptines ?? 0) >= 1 },
  { id: "lecteur", emoji: "📚", titre: "Rat de bibliothèque", texte: "Lire 3 histoires", test: (p) => (p.compteurs.histoires ?? 0) >= 3 },
  { id: "polyglotte", emoji: "🌏", titre: "Petit polyglotte", texte: "Apprendre 200 mots ou phrases", test: (p, s) => s.nbMots >= 200 },
  { id: "coffres", emoji: "🎁", titre: "Chasseur de trésors", texte: "Ouvrir 3 coffres de quêtes", test: (p) => (p.compteurs.coffres ?? 0) >= 3 },
  { id: "dragon", emoji: "🐲", titre: "Année du dragon", texte: "Atteindre le niveau Dragon", test: (p) => niveauPour(p.xp).numero >= 5 },
  { id: "album", emoji: "🦄", titre: "Collectionneur", texte: "Gagner 10 autocollants", test: (p) => p.autocollants.length >= 10 },
];

export function verifierBadges() {
  const p = profilActif();
  if (!p) return [];
  const s = statistiques(p);
  const nouveaux = BADGES.filter((b) => !p.badges.includes(b.id) && b.test(p, s));
  if (!nouveaux.length) return [];
  modifierActif((profil) => { profil.badges.push(...nouveaux.map((b) => b.id)); });
  nouveaux.forEach((b, i) => setTimeout(() => toast(b.emoji, "Nouveau badge !", b.titre), 600 + i * 900));
  return nouveaux;
}

// ---------- XP et événements ----------

function compter(cle, valeur = 1, mode = "ajout") {
  modifierActif((p) => {
    p.compteurs[cle] = mode === "max" ? Math.max(p.compteurs[cle] ?? 0, valeur) : (p.compteurs[cle] ?? 0) + valeur;
  });
}

// Ajoute des XP et annonce un changement de niveau. Renvoie { avant, apres }.
export function gagnerXP(points) {
  const p = profilActif();
  if (!p || points <= 0) return null;
  const avant = niveauPour(p.xp);
  ajouterXP(points);
  const apres = niveauPour(profilActif().xp);
  avancerQuete("xp", points);
  if (apres.numero > avant.numero) {
    setTimeout(() => toast(apres.emoji, `Niveau ${apres.numero} : ${apres.nom} !`, `${apres.hanzi} ${apres.pinyin}`), 300);
  }
  return { avant, apres };
}

// Point d'entrée unique pour tout ce qui fait progresser.
export function evenement(type, details = {}) {
  if (!profilActif()) return;
  switch (type) {
    case "lecon":
      avancerQuete("lecon", 1);
      if (details.revision) avancerQuete("revision", 1);
      avancerQuete("justes", details.justes ?? 0);
      avancerQuete("justesEnfant", details.justes ?? 0);
      avancerQuete("combo", details.comboMax ?? 0, "max");
      if (details.parfait) compter("parfaits");
      compter("meilleurCombo", details.comboMax ?? 0, "max");
      break;
    case "phrase":
      avancerQuete("phrase", 1);
      compter("dites");
      gagnerXP(2);
      break;
    case "tons":
      avancerQuete("tons", 1);
      compter("meilleurTons", details.score ?? 0, "max");
      break;
    case "quiz":
      avancerQuete("justes", details.justes ?? 0);
      avancerQuete("justesEnfant", details.justes ?? 0);
      break;
    case "comptine":
      avancerQuete("comptine", 1);
      if (details.complete) compter("comptines");
      break;
    case "imagier":
      avancerQuete("imagier", 1);
      break;
    case "histoire":
      avancerQuete("histoire", 1);
      compter("histoires");
      break;
  }
  verifierBadges();
}

// ---------- Notifications (toasts) ----------

export function toast(emoji, titre, texte = "") {
  if (typeof document === "undefined") return;
  let zone = document.getElementById("toasts");
  if (!zone) {
    zone = document.createElement("div");
    zone.id = "toasts";
    zone.setAttribute("aria-live", "polite");
    document.body.appendChild(zone);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="toast-emoji"></span><span><strong></strong><small></small></span>`;
  t.querySelector(".toast-emoji").textContent = emoji;
  t.querySelector("strong").textContent = titre;
  t.querySelector("small").textContent = texte;
  zone.appendChild(t);
  sonVictoire();
  setTimeout(() => t.classList.add("sortie"), 3200);
  setTimeout(() => t.remove(), 3700);
}
