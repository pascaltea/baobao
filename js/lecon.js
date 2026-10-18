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

import { prononcer, melanger, activerHorsLigne } from "./app.js";
import { chargerParcours, toutesLesLecons } from "./parcours.js";
import { profilActif, niveauMot, enregistrerReponse, terminerLecon, ajouterXP, motsARevoir, statistiques } from "./profils.js";
import { rubyHTML, variantesTon } from "./pinyin.js";
import { sonJuste, sonFaux, sonVictoire } from "./sons.js";

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

let tousLesMots = [];
let lecon = null;          // la leçon du parcours (null pour la révision du jour)
let pas = [];              // la file des étapes
let total = 0;             // nombre d'étapes prévues au départ
let index = 0;
let faits = 0;             // étapes réussies (fait avancer la barre)
let combo = 0;
let nbReponses = 0;
let nbJustes = 0;
const erreurs = new Set(); // mots sur lesquels on s'est trompé
const motsSession = new Map();

// ---------- Construction des exercices ----------

// Mauvaises réponses : de préférence du même thème, toutes différentes.
function leurres(mot, nb, champ) {
  const deja = new Set([mot[champ]]);
  const resultat = [];
  const candidats = [...melanger(tousLesMots.filter((m) => m.theme === mot.theme)), ...melanger(tousLesMots)];
  for (const m of candidats) {
    if (resultat.length >= nb) break;
    if (!m[champ] || deja.has(m[champ])) continue;
    // Évite les choix ambigus comme « bonjour » / « bonjour (le matin) ».
    if (champ === "fr" && (m.fr.includes(mot.fr) || mot.fr.includes(m.fr))) continue;
    deja.add(m[champ]);
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
        options: options(mot, "emoji", (m) => m.emoji, "choix-emoji") };
    case "hanzi-fr":
      return { type, mot, bonne: mot.id, audio: true,
        consigne: "Que veut dire ce mot ?",
        question: `<div class="q-hanzi">${debutant ? rubyHTML(mot.hanzi, mot.pinyin) : mot.hanzi}</div>`,
        options: options(mot, "fr", (m) => m.fr) };
    case "image-hanzi":
      return { type, mot, bonne: mot.id, audio: enfant,
        consigne: enfant ? "Touche le bon caractère" : `Comment dit-on « ${mot.fr} » ?`,
        question: `<div class="q-emoji">${mot.emoji}</div>${enfant ? "" : `<div class="q-fr">${mot.fr}</div>`}`,
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
        question: `<div class="q-emoji petit">${mot.emoji}</div><div class="q-hanzi">${mot.hanzi}</div>`,
        options: melanger([mot.pinyin, ...variantes]).map((p) => ({ id: p, html: p, classe: "choix-pinyin" })) };
    }
  }
}

function construireNouvelleLecon(nouveaux) {
  const liste = [];
  const vus = [];
  nouveaux.forEach((mot, i) => {
    liste.push({ type: "decouverte", mot });
    motsSession.set(mot.id, mot);
    liste.push(exercice(alea(TYPES.facile), mot));
    vus.push(mot);
    // Tous les deux mots, on revient sur un mot déjà vu.
    if (i % 2 === 1) liste.push(exercice(alea(TYPES.moyen), alea(vus.slice(0, -1))));
  });
  if (vus.length >= 3) liste.push({ type: "paires", mots: melanger(vus).slice(0, 5) });
  for (const mot of melanger(vus)) liste.push(exercice(alea(TYPES.difficile), mot));
  return liste;
}

function construireRevision(mots) {
  // Les mots les plus fragiles d'abord (niveau le plus bas), 8 au maximum.
  const choisis = melanger(mots).sort((a, b) => niveauMot(a.id) - niveauMot(b.id)).slice(0, 8);
  const liste = choisis.map((mot) => exercice(alea(TYPES.moyen), mot));
  if (choisis.length >= 3) liste.push({ type: "paires", mots: melanger(choisis).slice(0, 5) });
  for (const mot of melanger(choisis)) liste.push(exercice(alea(TYPES.difficile), mot));
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
  else if (etape.type === "paires") afficherPaires(etape);
  else afficherChoix(etape);
}

function afficherDecouverte({ mot }) {
  const zone = $("zone");
  zone.innerHTML = `
    <p class="etiquette">✨ Nouveau mot</p>
    <div class="decouverte">
      <div class="d-emoji">${mot.emoji}</div>
      <div class="d-hanzi">${rubyHTML(mot.hanzi, mot.pinyin)}</div>
      <div class="d-fr">${mot.fr}</div>
    </div>
    <div class="mascotte"><span class="panda">🐼</span><p class="bulle"></p></div>`;
  zone.querySelector(".decouverte").appendChild(boutonsSon(mot.hanzi));
  zone.querySelector(".bulle").textContent = mot.astuce || alea(MASCOTTE);
  setTimeout(() => prononcer(mot.hanzi), 250);
  afficherBandeau("neutre", "", "", "Continuer");
  pas[index].reussi = true;
}

function afficherChoix(etape) {
  const zone = $("zone");
  zone.innerHTML = `<p class="consigne"></p><div class="question">${etape.question ?? ""}</div><div class="choix"></div>`;
  zone.querySelector(".consigne").textContent = etape.consigne;
  if (etape.audio) {
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
  return `<span class="b-mot">${mot.emoji} ${rubyHTML(mot.hanzi, mot.pinyin)}</span> = ${mot.fr}`;
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
    faits++;
    etape.reussi = true;
    sonJuste();
    const titre = alea(BRAVO) + (combo >= 3 ? ` 🔥 ${combo} d'affilée !` : "");
    afficherBandeau("ok", titre, detailMot(etape.mot));
  } else {
    combo = 0;
    bouton.classList.add("faux");
    erreurs.add(etape.mot.id);
    sonFaux();
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
  for (const mot of melanger(etape.mots)) creer("droite", mot, enfant ? mot.emoji : `${mot.emoji} ${mot.fr}`, enfant ? "choix-emoji" : "");
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

  const parfait = erreurs.size === 0;
  const xp = 10 + (parfait ? 5 : 0);
  const avant = statistiques();
  ajouterXP(xp);
  const apres = statistiques();
  const objectifAtteint = avant.xpJour < apres.objectif && apres.xpJour >= apres.objectif;
  const precision = nbReponses ? Math.round((nbJustes / nbReponses) * 100) : 100;

  $("barre").style.width = "100%";
  $("combo").textContent = "";
  const zone = $("zone");
  zone.innerHTML = `
    <div class="fin">
      <div class="fin-emoji">${parfait ? "🏆" : "🎉"}</div>
      <h2>${lecon && !lecon.revision ? "Leçon terminée !" : "Révision terminée !"}</h2>
      <p>${parfait ? "Sans aucune faute, 太棒了 (tài bàng le) !" : "Les mots difficiles reviendront dans tes révisions."}</p>
      <div class="tuiles-fin">
        <div class="tuile-fin or"><small>XP gagnés</small><strong>⭐ +${xp}</strong></div>
        <div class="tuile-fin vert"><small>Précision</small><strong>🎯 ${precision} %</strong></div>
        <div class="tuile-fin rouge"><small>Série</small><strong>🔥 ${apres.serie} j</strong></div>
      </div>
      ${objectifAtteint ? `<p class="objectif-atteint">🎯 Objectif du jour atteint !</p>` : ""}
      <div class="mots-fin"></div>
    </div>`;
  const liste = zone.querySelector(".mots-fin");
  for (const mot of motsSession.values()) {
    const puce = document.createElement("button");
    puce.className = "puce-mot" + (erreurs.has(mot.id) ? " a-revoir" : "");
    puce.innerHTML = `${mot.emoji} ${rubyHTML(mot.hanzi, mot.pinyin)}`;
    puce.title = mot.fr;
    puce.addEventListener("click", () => prononcer(mot.hanzi));
    liste.appendChild(puce);
  }
  afficherBandeau("neutre", "", "", "Continuer");
  $("continuer").onclick = () => { location.href = "../index.html"; };
  sonVictoire();
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
  const unites = await chargerParcours("../data/vocabulaire/");
  tousLesMots = unites.flatMap((u) => u.mots);
  const params = new URLSearchParams(location.search);

  if (params.get("revision") === "jour") {
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
    pas = lecon.revision ? construireRevision(lecon.mots) : construireNouvelleLecon(lecon.mots);
  }
  total = pas.length;
  afficherPas();
}

demarrer();
