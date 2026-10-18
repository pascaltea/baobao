// Moteur de leçon, façon Duolingo :
//  1. chaque nouveau mot est d'abord présenté (découverte),
//  2. puis pratiqué avec des exercices de plus en plus difficiles,
//  3. les erreurs reviennent à la fin de la leçon,
//  4. le bilan met à jour la répétition espacée, les XP et la série.
//
// Adresse de la page :
//   lecon.html?cle=animaux:0         une leçon du parcours
//   lecon.html?cle=animaux:revision  la révision d'une unité
//   lecon.html?revision=jour         les mots à réviser aujourd'hui
//   lecon.html?routine=repas         les phrases du quotidien d'une routine
//   lecon.html?test=animaux          test de passage : valider une unité d'un coup

import { prononcer, melanger, activerHorsLigne, vibrer } from "./app.js";
import { chargerParcours, chargerRoutines, toutesLesLecons } from "./parcours.js";
import {
  profilActif, niveauMot, enregistrerReponse, terminerLecon, motsARevoir, statistiques, gagnerAutocollant,
} from "./profils.js";
import { gagnerXP, evenement, niveauPour } from "./gamification.js";
import { mascotte } from "./mascotte.js";
import { rubyHTML, variantesTon } from "./pinyin.js";
import { sonJuste, sonFaux, sonVictoire } from "./sons.js";
import { boutonsMicro } from "./micro.js";
import { visuel, cleVisuel } from "./visuel.js";

const $ = (id) => document.getElementById(id);
const alea = (liste) => liste[Math.floor(Math.random() * liste.length)];

const BRAVO = ["Excellent !", "Super !", "Bravo !", "Parfait !", "太棒了 !", "Génial !", "好 ! Bien joué !"];
const MASCOTTE = ["Écoute bien et répète à voix haute !", "Regarde la couleur du pinyin : elle montre le ton.", "加油 (jiāyóu) : courage !"];

const profil = profilActif();
const enfant = profil?.mode === "enfant";

// Exercices possibles selon la difficulté. Le mode enfant n'utilise que des images et le son.
const TYPES = enfant
  ? { facile: ["ecoute-image"], moyen: ["ecoute-image", "image-hanzi"], difficile: ["image-hanzi", "ecoute-image"] }
  : { facile: ["ecoute-image", "hanzi-fr"], moyen: ["hanzi-fr", "image-hanzi", "ecoute-image"], difficile: ["ecoute-hanzi", "pinyin-ton", "image-hanzi"] };

// Pour les phrases, on vise la compréhension orale et la production (remettre dans l'ordre).
const TYPES_PHRASES = { facile: ["ecoute-fr", "hanzi-fr"], moyen: ["ecoute-fr", "fr-phrase"], difficile: ["ordre", "fr-phrase", "ecoute-fr"] };

const choisirType = (mot, difficulte) => {
  const types = (mot.phrase ? TYPES_PHRASES : TYPES)[difficulte];
  const possibles = types.filter((t) => t !== "ordre" || mot.morceaux?.length >= 3);
  return alea(possibles.length ? possibles : types.filter((t) => t !== "ordre"));
};

let tousLesMots = [];
let routine = null;
let testUnite = null;      // unité visée par un test de passage
const SEUIL_TEST = 0.8;    // 80 % de bonnes réponses pour valider
let lecon = null;          // la leçon du parcours (null pour la révision du jour)
let pas = [];              // la file des étapes
let total = 0;             // nombre d'étapes prévues au départ
let index = 0;
let faits = 0;             // étapes réussies (fait avancer la barre)
let combo = 0;
let comboMax = 0;
let nbReponses = 0;
let nbJustes = 0;
const erreurs = new Set(); // mots sur lesquels on s'est trompé
const motsSession = new Map();

// ---------- Construction des exercices ----------

// Mauvaises réponses : de préférence du même thème, toutes différentes.
function leurres(mot, nb, champ) {
  const val = (m) => (champ === "emoji" ? cleVisuel(m) : m[champ]);
  const deja = new Set([val(mot)]);
  const resultat = [];
  // Une phrase a pour leurres d'autres phrases, un mot d'autres mots.
  const pool = tousLesMots.filter((m) => !!m.phrase === !!mot.phrase);
  const candidats = [...melanger(pool.filter((m) => m.theme === mot.theme)), ...melanger(pool)];
  for (const m of candidats) {
    if (resultat.length >= nb) break;
    if (!val(m) || deja.has(val(m))) continue;
    // Évite les choix ambigus comme « bonjour » / « bonjour (le matin) ».
    if (champ === "fr" && (m.fr.includes(mot.fr) || mot.fr.includes(m.fr))) continue;
    deja.add(val(m));
    resultat.push(m);
  }
  return resultat;
}

function options(mot, champ, rendu, classe = "") {
  return melanger([mot, ...leurres(mot, 3, champ)]).map((m) => ({ id: m.id, html: rendu(m), classe }));
}

function exercice(type, mot) {
  motsSession.set(mot.id, mot);
  const debutant = niveauMot(mot.id) < 2;
  switch (type) {
    case "ecoute-image":
      return { type, mot, bonne: mot.id, audio: true,
        consigne: "Écoute et touche la bonne image",
        options: options(mot, "emoji", (m) => visuel(m), "choix-emoji") };
    case "hanzi-fr":
      return { type, mot, bonne: mot.id, audio: true,
        consigne: "Que veut dire ce mot ?",
        question: `<div class="q-hanzi">${debutant ? rubyHTML(mot.hanzi, mot.pinyin) : mot.hanzi}</div>`,
        options: options(mot, "fr", (m) => m.fr) };
    case "image-hanzi":
      return { type, mot, bonne: mot.id, audio: enfant,
        consigne: enfant ? "Touche le bon caractère" : `Comment dit-on « ${mot.fr} » ?`,
        question: `<div class="q-emoji">${visuel(mot)}</div>${enfant ? "" : `<div class="q-fr">${mot.fr}</div>`}`,
        options: options(mot, "hanzi", (m) => m.hanzi, "choix-hanzi") };
    case "ecoute-hanzi":
      return { type, mot, bonne: mot.id, audio: true,
        consigne: "Écoute et touche le bon caractère",
        options: options(mot, "hanzi", (m) => m.hanzi, "choix-hanzi") };
    case "pinyin-ton": {
      const variantes = variantesTon(mot.pinyin, 3);
      if (variantes.length < 2) return exercice("image-hanzi", mot);
      return { type, mot, bonne: mot.pinyin, audio: false,
        consigne: "Quel est le bon pinyin ? Attention aux tons !",
        question: `<div class="q-emoji petit">${visuel(mot)}</div><div class="q-hanzi">${mot.hanzi}</div>`,
        options: melanger([mot.pinyin, ...variantes]).map((p) => ({ id: p, html: p, classe: "choix-pinyin" })) };
    }
    case "ecoute-fr":
      return { type, mot, bonne: mot.id, audio: true,
        consigne: "Écoute : qu'est-ce que ça veut dire ?",
        options: options(mot, "fr", (m) => m.fr) };
    case "fr-phrase":
      return { type, mot, bonne: mot.id, audio: false,
        consigne: "Comment dit-on en chinois…",
        question: `<div class="q-emoji petit">${visuel(mot)}</div><div class="q-fr">« ${mot.fr} »</div>`,
        options: options(mot, "hanzi", (m) => (debutant ? rubyHTML(m.hanzi, m.pinyin) : m.hanzi), "choix-phrase") };
    case "ordre":
      return { type, mot, bonne: mot.morceaux.join(""), audio: false,
        consigne: "Remets la phrase dans l'ordre",
        question: `<div class="q-emoji petit">${visuel(mot)}</div><div class="q-fr">« ${mot.fr} »</div>`,
        morceaux: melanger(mot.morceaux) };
  }
}

function construireNouvelleLecon(nouveaux, note) {
  const liste = [];
  // La note de grammaire de l'unité ouvre la première leçon (pour les adultes).
  if (note && !enfant) liste.push({ type: "note", texte: note });
  const vus = [];
  nouveaux.forEach((mot, i) => {
    liste.push({ type: "decouverte", mot });
    motsSession.set(mot.id, mot);
    liste.push(exercice(choisirType(mot, "facile"), mot));
    vus.push(mot);
    // Tous les deux mots, on revient sur un mot déjà vu.
    if (i % 2 === 1) {
      const ancien = alea(vus.slice(0, -1));
      liste.push(exercice(choisirType(ancien, "moyen"), ancien));
    }
  });
  if (vus.length >= 3) liste.push({ type: "paires", mots: melanger(vus).slice(0, enfant ? 4 : 5) });
  // Leçons plus courtes pour les enfants : 3 exercices de fin au lieu d'un par mot.
  for (const mot of melanger(vus).slice(0, enfant ? 3 : vus.length)) liste.push(exercice(choisirType(mot, "difficile"), mot));
  return liste;
}

function construireRevision(mots) {
  // Les mots les plus fragiles d'abord (niveau le plus bas), 8 au maximum.
  const choisis = melanger(mots).sort((a, b) => niveauMot(a.id) - niveauMot(b.id)).slice(0, 8);
  const liste = choisis.map((mot) => exercice(choisirType(mot, "moyen"), mot));
  const motsSimples = choisis.filter((m) => !m.phrase);
  if (motsSimples.length >= 3) liste.push({ type: "paires", mots: melanger(motsSimples).slice(0, 5) });
  for (const mot of melanger(choisis)) liste.push(exercice(choisirType(mot, "difficile"), mot));
  return liste;
}

// ---------- Affichage ----------

function majBarre() {
  $("barre").style.width = `${Math.min(100, (faits / total) * 100)}%`;
  $("combo").textContent = combo >= 3 ? `🔥 ${combo}` : "";
}

function boutonsSon(texte) {
  const zone = document.createElement("div");
  zone.className = "sons";
  zone.innerHTML = `<button class="bouton-son" aria-label="Écouter">🔊</button><button class="bouton-son lent" aria-label="Écouter lentement">🐢</button>`;
  const [normal, lent] = zone.querySelectorAll("button");
  normal.addEventListener("click", () => prononcer(texte));
  lent.addEventListener("click", () => prononcer(texte, 0.45));
  return zone;
}

function afficherBandeau(etat, titre, detail, texteBouton = "Continuer") {
  const bandeau = $("bandeau");
  bandeau.className = `bandeau ${etat}`;
  $("b-mascotte").innerHTML = etat === "ok" ? mascotte("bravo", "saute") : etat === "ko" ? mascotte("oups", "penche") : "";
  $("b-titre").textContent = titre;
  $("b-detail").innerHTML = detail;
  $("continuer").textContent = texteBouton;
  $("continuer").focus({ preventScroll: true });
}

function afficherPas() {
  const etape = pas[index];
  majBarre();
  $("bandeau").classList.add("cache");
  const zone = $("zone");
  zone.innerHTML = "";
  zone.classList.remove("apparition");
  void zone.offsetWidth; // relance l'animation d'apparition
  zone.classList.add("apparition");
  if (etape.type === "decouverte") afficherDecouverte(etape);
  else if (etape.type === "note") afficherNote(etape);
  else if (etape.type === "paires") afficherPaires(etape);
  else if (etape.type === "ordre") afficherOrdre(etape);
  else afficherChoix(etape);
}

function afficherNote({ texte }) {
  $("zone").innerHTML = `
    <p class="etiquette">📖 À savoir avant de commencer</p>
    <div class="carte note-lecon"></div>
    <div class="mascotte"><div class="avatar-mascotte">${mascotte("content", "respire")}</div><p class="bulle">Pas besoin de tout retenir : on le reverra en pratiquant !</p></div>`;
  $("zone").querySelector(".note-lecon").textContent = texte;
  afficherBandeau("neutre", "", "", "C'est parti !");
  pas[index].reussi = true;
}

// Exercice de production : on reconstruit la phrase en touchant les mots.
function afficherOrdre(etape) {
  const zone = $("zone");
  zone.innerHTML = `<p class="consigne"></p><div class="question">${etape.question}</div>
    <div class="ligne-reponse" aria-label="Ta phrase"></div>
    <div class="banque"></div>
    <div class="actions"><button class="bouton" id="verifier" disabled>Vérifier</button></div>`;
  zone.querySelector(".consigne").textContent = etape.consigne;
  const ligne = zone.querySelector(".ligne-reponse");
  const banque = zone.querySelector(".banque");
  const verifier = zone.querySelector("#verifier");

  etape.morceaux.forEach((morceau) => {
    const b = document.createElement("button");
    b.className = "morceau";
    b.textContent = morceau;
    b.addEventListener("click", () => {
      if (etape.repondu) return;
      // Un mot passe de la banque à la phrase, et inversement.
      (b.parentElement === banque ? ligne : banque).appendChild(b);
      prononcer(morceau);
      verifier.disabled = ligne.children.length !== etape.morceaux.length;
    });
    banque.appendChild(b);
  });

  verifier.addEventListener("click", () => {
    const reponse = [...ligne.children].map((b) => b.textContent).join("");
    verifier.disabled = true;
    ligne.classList.add(reponse === etape.bonne ? "bon" : "faux");
    repondre(etape, reponse, null);
  });
}

function afficherDecouverte({ mot }) {
  const zone = $("zone");
  zone.innerHTML = `
    <p class="etiquette">✨ Nouveau mot</p>
    <div class="decouverte">
      <div class="d-emoji">${visuel(mot)}</div>
      <div class="d-hanzi">${rubyHTML(mot.hanzi, mot.pinyin)}</div>
      <div class="d-fr">${mot.fr}</div>
    </div>
    <div class="mascotte"><div class="avatar-mascotte">${mascotte("parle", "respire")}</div><p class="bulle"></p></div>`;
  zone.querySelector(".decouverte").appendChild(boutonsSon(mot.hanzi));
  if (!enfant) zone.querySelector(".decouverte").appendChild(boutonsMicro(mot.hanzi));
  zone.querySelector(".bulle").textContent = mot.astuce || (mot.phrase && routine?.conseil) || alea(MASCOTTE);
  if (mot.phrase) zone.querySelector(".d-hanzi").classList.add("phrase");
  setTimeout(() => prononcer(mot.hanzi), 250);
  afficherBandeau("neutre", "", "", "Continuer");
  pas[index].reussi = true;
}

function afficherChoix(etape) {
  const zone = $("zone");
  zone.innerHTML = `<p class="consigne"></p><div class="question">${etape.question ?? ""}</div><div class="choix"></div>`;
  zone.querySelector(".consigne").textContent = etape.consigne;
  if (etape.audio && !etape.question) {
    // Exercice d'écoute : c'est Bao qui parle, les boutons son sont dans sa bulle.
    const parle = document.createElement("div");
    parle.className = "q-parle";
    parle.innerHTML = `<div class="avatar-mascotte">${mascotte("parle", "respire")}</div><div class="bulle"></div>`;
    parle.querySelector(".bulle").appendChild(boutonsSon(etape.mot.hanzi));
    zone.querySelector(".question").appendChild(parle);
    setTimeout(() => prononcer(etape.mot.hanzi), 250);
  } else if (etape.audio) {
    zone.querySelector(".question").appendChild(boutonsSon(etape.mot.hanzi));
    setTimeout(() => prononcer(etape.mot.hanzi), 250);
  }
  const grille = zone.querySelector(".choix");
  for (const opt of etape.options) {
    const bouton = document.createElement("button");
    bouton.className = opt.classe;
    bouton.innerHTML = opt.html;
    bouton.dataset.id = opt.id;
    bouton.addEventListener("click", () => repondre(etape, opt.id, bouton));
    grille.appendChild(bouton);
  }
}

function detailMot(mot) {
  return `<span class="b-mot">${visuel(mot)} ${rubyHTML(mot.hanzi, mot.pinyin)}</span> = ${mot.fr}`;
}

function repondre(etape, choix, bouton) {
  if (etape.repondu) return;
  etape.repondu = true;
  const juste = choix === etape.bonne;
  nbReponses++;
  for (const b of $("zone").querySelectorAll(".choix button")) {
    b.disabled = true;
    if (b.dataset.id === etape.bonne) b.classList.add("bon");
  }
  if (juste) {
    nbJustes++;
    combo++;
    comboMax = Math.max(comboMax, combo);
    faits++;
    etape.reussi = true;
    sonJuste();
    vibrer(25);
    const titre = alea(BRAVO) + (combo >= 3 ? ` 🔥 ${combo} d'affilée !` : "");
    afficherBandeau("ok", titre, detailMot(etape.mot));
  } else {
    combo = 0;
    bouton?.classList.add("faux");
    erreurs.add(etape.mot.id);
    sonFaux();
    vibrer([40, 60, 40]);
    // L'exercice reviendra (mélangé autrement) à la fin de la leçon.
    pas.push(exercice(etape.type, etape.mot));
    afficherBandeau("ko", "Bonne réponse :", detailMot(etape.mot));
  }
  majBarre();
  setTimeout(() => prononcer(etape.mot.hanzi), 450);
}

function afficherPaires(etape) {
  const zone = $("zone");
  zone.innerHTML = `<p class="consigne">Associe les paires</p><div class="paires"><div class="colonne" id="gauche"></div><div class="colonne" id="droite"></div></div>`;
  let restantes = etape.mots.length;
  let selection = { gauche: null, droite: null };

  const creer = (cote, mot, html, classe) => {
    const b = document.createElement("button");
    b.className = classe;
    b.innerHTML = html;
    b.dataset.id = mot.id;
    b.addEventListener("click", () => {
      if (b.disabled) return;
      if (cote === "gauche") prononcer(mot.hanzi);
      selection[cote]?.classList.remove("choisi");
      selection[cote] = b;
      b.classList.add("choisi");
      const { gauche, droite } = selection;
      if (!gauche || !droite) return;
      nbReponses++;
      if (gauche.dataset.id === droite.dataset.id) {
        nbJustes++;
        for (const x of [gauche, droite]) { x.classList.remove("choisi"); x.classList.add("bon"); x.disabled = true; }
        sonJuste();
        restantes--;
        if (restantes === 0) {
          faits++;
          combo++;
          comboMax = Math.max(comboMax, combo);
          etape.reussi = true;
          majBarre();
          afficherBandeau("ok", alea(BRAVO), "Toutes les paires sont trouvées !");
        }
      } else {
        combo = 0;
        erreurs.add(gauche.dataset.id);
        erreurs.add(droite.dataset.id);
        sonFaux();
        for (const x of [gauche, droite]) { x.classList.remove("choisi"); x.classList.add("faux"); }
        setTimeout(() => { gauche.classList.remove("faux"); droite.classList.remove("faux"); }, 600);
        majBarre();
      }
      selection = { gauche: null, droite: null };
    });
    $(cote).appendChild(b);
  };

  for (const mot of melanger(etape.mots)) creer("gauche", mot, mot.hanzi, "choix-hanzi");
  for (const mot of melanger(etape.mots)) creer("droite", mot, enfant ? visuel(mot) : `${visuel(mot)} ${mot.fr}`, enfant ? "choix-emoji" : "");
}

// ---------- Fin de leçon ----------

function confettis() {
  const couleurs = ["#d7263d", "#f4b400", "#2e9e5b", "#1e88e5", "#8e24aa"];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = alea(couleurs);
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}

function terminer() {
  for (const mot of motsSession.values()) enregistrerReponse(mot.id, !erreurs.has(mot.id));
  if (lecon) terminerLecon(lecon.cle);
  const precisionTest = nbReponses ? nbJustes / nbReponses : 0;
  const testReussi = testUnite && precisionTest >= SEUIL_TEST;
  if (testReussi) for (const l of testUnite.lecons) terminerLecon(l.cle);
  const autocollant = enfant ? gagnerAutocollant() : null;

  const parfait = erreurs.size === 0;
  const xp = 10 + (parfait ? 5 : 0);
  const avant = statistiques();
  const niveaux = gagnerXP(xp);
  evenement("lecon", { parfait, revision: !lecon || lecon.revision, justes: nbJustes, comboMax });
  const apres = statistiques();
  const niveau = niveauPour(profilActif().xp);
  const objectifAtteint = avant.xpJour < apres.objectif && apres.xpJour >= apres.objectif;
  const precision = nbReponses ? Math.round((nbJustes / nbReponses) * 100) : 100;

  $("barre").style.width = "100%";
  $("combo").textContent = "";
  const zone = $("zone");
  zone.innerHTML = `
    <div class="fin">
      <div class="fin-mascotte">${mascotte("bravo", "saute")}</div>
      <h2>${testUnite ? (testReussi ? `${testUnite.emoji} Unité « ${testUnite.titre} » validée !` : "Pas encore… mais bien essayé !") : routine ? `${routine.emoji} ${routine.titre} : entraînement terminé !` : lecon && !lecon.revision ? "Leçon terminée !" : "Révision terminée !"}</h2>
      ${testUnite && !testReussi ? `<p>Il faut 80 % de bonnes réponses pour sauter l'unité. Les leçons t'aideront à y arriver !</p>` : ""}
      <p>${parfait ? "Sans aucune faute, 太棒了 (tài bàng le) !" : "Les mots difficiles reviendront dans tes révisions."}</p>
      ${autocollant ? `<div class="autocollant-gagne"><span>${autocollant}</span>Tu gagnes un autocollant !</div>` : ""}
      ${routine ? `<p class="carte defi">💬 <strong>Défi :</strong> utilise une de ces phrases avec tes enfants aujourd'hui, puis coche-la dans « Au quotidien » (+2 XP).</p>` : ""}
      <div class="tuiles-fin">
        <div class="tuile-fin or"><small>XP gagnés</small><strong>⭐ +${xp}</strong></div>
        <div class="tuile-fin vert"><small>Précision</small><strong>🎯 ${precision} %</strong></div>
        <div class="tuile-fin rouge"><small>Série</small><strong>🔥 ${apres.serie} j</strong></div>
      </div>
      ${objectifAtteint ? `<p class="objectif-atteint">🎯 Objectif du jour atteint !</p>` : ""}
      ${niveaux && niveaux.apres.numero > niveaux.avant.numero ? `<p class="objectif-atteint">🎊 Niveau supérieur : ${niveau.emoji} ${niveau.nom} ${niveau.hanzi} !</p>` : ""}
      <div class="carte fin-niveau">
        <div class="objectif-texte"><span>${niveau.emoji} Niveau ${niveau.numero} · ${niveau.nom}</span><span>${niveau.suivant ? `${niveau.xpDansNiveau} / ${niveau.xpPourSuivant} XP` : "MAX"}</span></div>
        <div class="barre"><span id="fin-barre"></span></div>
      </div>
      <div class="mots-fin"></div>
    </div>`;
  const liste = zone.querySelector(".mots-fin");
  for (const mot of motsSession.values()) {
    const puce = document.createElement("button");
    puce.className = "puce-mot" + (erreurs.has(mot.id) ? " a-revoir" : "");
    puce.innerHTML = `${visuel(mot)} ${rubyHTML(mot.hanzi, mot.pinyin)}`;
    puce.title = mot.fr;
    puce.addEventListener("click", () => prononcer(mot.hanzi));
    liste.appendChild(puce);
  }
  afficherBandeau("neutre", "", "", "Continuer");
  $("continuer").onclick = () => { location.href = "../index.html"; };
  requestAnimationFrame(() => setTimeout(() => { $("fin-barre").style.width = `${niveau.progression * 100}%`; }, 300));
  sonVictoire();
  vibrer([30, 50, 30, 50, 60]);
  confettis();
}

// ---------- Démarrage ----------

$("continuer").addEventListener("click", () => {
  if (index >= pas.length) return;
  if (pas[index].type === "decouverte") faits++;
  index++;
  if (index >= pas.length) terminer();
  else afficherPas();
});

async function demarrer() {
  if (!profil) { location.href = "../index.html"; return; }
  activerHorsLigne("../");
  const [unites, routines] = await Promise.all([chargerParcours("../data/vocabulaire/"), chargerRoutines("../data/")]);
  tousLesMots = [...unites.flatMap((u) => u.mots), ...routines.flatMap((r) => r.phrases)];
  const params = new URLSearchParams(location.search);

  if (params.get("test")) {
    testUnite = unites.find((u) => u.id === params.get("test"));
    if (!testUnite) { location.href = "../index.html"; return; }
    // 10 mots de l'unité, exercices difficiles uniquement, sans découverte.
    const choisis = melanger(testUnite.mots).slice(0, 10);
    pas = choisis.map((mot) => exercice(choisirType(mot, "difficile"), mot));
  } else if (params.get("routine")) {
    routine = routines.find((r) => r.id === params.get("routine"));
    if (!routine) { location.href = "../index.html"; return; }
    // Les phrases jamais vues sont découvertes, les autres seulement révisées.
    const nouvelles = routine.phrases.filter((p) => niveauMot(p.id) === 0).slice(0, 4);
    pas = nouvelles.length ? construireNouvelleLecon(nouvelles) : construireRevision(routine.phrases);
  } else if (params.get("revision") === "jour") {
    const aRevoir = new Set(motsARevoir());
    const mots = tousLesMots.filter((m) => aRevoir.has(m.id));
    if (mots.length === 0) {
      $("zone").innerHTML = `<div class="fin"><div class="fin-emoji">✅</div><h2>Rien à réviser aujourd'hui</h2><p>Reviens demain, ou continue le parcours !</p><a class="bouton" href="../index.html">Retour</a></div>`;
      return;
    }
    pas = construireRevision(mots);
  } else {
    lecon = toutesLesLecons(unites).find((l) => l.cle === params.get("cle"));
    if (!lecon) { location.href = "../index.html"; return; }
    const unite = unites.find((u) => u.id === lecon.unite);
    const premiere = unite.lecons[0] === lecon;
    pas = lecon.revision ? construireRevision(lecon.mots) : construireNouvelleLecon(lecon.mots, premiere ? unite.note : null);
  }
  total = pas.length;
  afficherPas();
}

demarrer();
