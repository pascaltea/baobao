// Page d'accueil : choix du profil et tableau de bord, adapté au type de profil
// (adulte, enfant 3-6 ans, bébé 0-2 ans). Les blocs portent un attribut
// data-modes qui liste les profils pour lesquels ils s'affichent.

import { prononcer, activerHorsLigne } from "./app.js";
import { chargerParcours, chargerRoutines, etatsLecons } from "./parcours.js";
import {
  listerProfils, ajouterProfil, choisirProfil, supprimerProfil, profilActif, changerMode, changerObjectif,
  statistiques, leconsTerminees, motsARevoir, motsConnus, phrasesDitesAujourdhui, marquerPhraseDite, aujourdhui,
} from "./profils.js";
import { rubyHTML } from "./pinyin.js";

const $ = (id) => document.getElementById(id);
const ICONES_MODE = { adulte: "🧑", enfant: "🧒", bebe: "👶" };

// Décalage horizontal des leçons pour dessiner un chemin qui serpente.
const ZIGZAG = [0, 45, 70, 45, 0, -45, -70, -45];

let unites = [];
let phrases = [];

function montrer(ecran) {
  $("ecran-profils").classList.toggle("cache", ecran !== "profils");
  $("ecran-accueil").classList.toggle("cache", ecran !== "accueil");
  const profil = profilActif();
  $("b-profil").classList.toggle("cache", !profil);
  if (profil) $("b-profil").textContent = `${profil.avatar} ${profil.nom}`;
}

// ---------- Profils ----------

function afficherProfils() {
  const actif = profilActif();
  const zone = $("profils");
  zone.innerHTML = "";
  for (const p of listerProfils()) {
    const stats = statistiques(p);
    const tuile = document.createElement("button");
    tuile.className = "tuile" + (actif?.id === p.id ? " active" : "");
    const detail = p.mode === "bebe" ? "👶 avec un parent" : `⭐ ${stats.xp} XP · 🔥 ${stats.serie} j`;
    tuile.innerHTML = `<span class="grand"></span><strong></strong><br><small>${ICONES_MODE[p.mode]} ${detail}</small>`;
    tuile.querySelector(".grand").textContent = p.avatar;
    tuile.querySelector("strong").textContent = p.nom;
    tuile.addEventListener("click", () => { choisirProfil(p.id); afficherAccueil(); });
    tuile.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Supprimer le profil ${p.nom} et toute sa progression ?`)) { supprimerProfil(p.id); afficherProfils(); }
    });
    zone.appendChild(tuile);
  }
  montrer("profils");
}

$("form-profil").addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = $("nom").value.trim();
  if (!nom) return;
  const mode = new FormData(e.target).get("mode");
  const avatarParDefaut = { adulte: "🙂", enfant: "🐼", bebe: "🐣" }[mode];
  ajouterProfil(nom, $("avatar").value.trim() || avatarParDefaut, mode);
  e.target.reset();
  afficherAccueil();
});

$("b-profil").addEventListener("click", afficherProfils);
$("r-mode").addEventListener("change", (e) => { changerMode(e.target.value); afficherAccueil(); });
$("r-objectif").addEventListener("change", (e) => { changerObjectif(Number(e.target.value)); afficherStats(); });

// ---------- Tableau de bord ----------

function appliquerMode(mode) {
  for (const bloc of document.querySelectorAll("[data-modes]")) {
    bloc.classList.toggle("cache", !bloc.dataset.modes.split(" ").includes(mode));
  }
}

function afficherStats() {
  const p = profilActif();
  const s = statistiques();
  $("s-serie").textContent = s.serie;
  $("s-xp").textContent = s.xp;
  $("s-mots").textContent = s.nbMots;
  $("o-texte").textContent = `${Math.min(s.xpJour, s.objectif)} / ${s.objectif} XP`;
  $("o-barre").style.width = `${Math.min(100, (s.xpJour / s.objectif) * 100)}%`;

  const nbRevision = motsARevoir().length;
  $("revision").classList.toggle("cache", nbRevision === 0 || p.mode === "bebe");
  $("r-texte").textContent = `${nbRevision} élément${nbRevision > 1 ? "s" : ""} à revoir pour ne pas oublier`;
  $("r-mode").value = p.mode;
  $("r-objectif").value = String(p.objectif);
}

// La phrase du jour change chaque jour, la même pour toute la famille.
function afficherPhraseDuJour() {
  const jour = Math.floor(new Date(aujourdhui()).getTime() / 86400000);
  const phrase = phrases[jour % phrases.length];
  $("pj-emoji").textContent = phrase.emoji;
  $("pj-hanzi").innerHTML = rubyHTML(phrase.hanzi, phrase.pinyin);
  $("pj-fr").textContent = phrase.fr;
  $("pj-son").onclick = () => prononcer(phrase.hanzi);
  $("pj-lent").onclick = () => prononcer(phrase.hanzi, 0.45);
  const dite = $("pj-dite");
  const maj = () => {
    const fait = phrasesDitesAujourdhui().has(phrase.id);
    dite.textContent = fait ? "✅ Dite aujourd'hui" : "💬 Je l'ai dite ! (+2 XP)";
    dite.classList.toggle("fait", fait);
    dite.disabled = fait;
  };
  dite.onclick = () => { marquerPhraseDite(phrase.id); maj(); afficherStats(); afficherEquipe(); };
  maj();
  // Sur un profil bébé, c'est le parent qui parle : les XP vont sur son propre profil.
  dite.classList.toggle("cache", profilActif().mode === "bebe");
}

function afficherParcours() {
  const etats = etatsLecons(unites, leconsTerminees());
  const connus = motsConnus();
  const enfant = profilActif().mode === "enfant";
  const zone = $("parcours");
  zone.innerHTML = "";
  let n = 0;

  for (const unite of unites) {
    const section = document.createElement("section");
    section.className = "unite";
    section.style.setProperty("--couleur", unite.couleur);
    const vus = unite.mots.filter((m) => connus.has(m.id)).length;
    section.innerHTML = `
      <div class="unite-entete">
        <div>
          <small>Unité ${unite.numero}</small>
          <h3>${unite.emoji} ${unite.titre}</h3>
          <small>${vus} / ${unite.mots.length} mots découverts</small>
        </div>
      </div>
      ${unite.note && !enfant ? `<details class="note-unite"><summary>📖 À savoir</summary><p></p></details>` : ""}
      <div class="chemin"></div>`;
    if (unite.note && !enfant) section.querySelector(".note-unite p").textContent = unite.note;
    const chemin = section.querySelector(".chemin");

    for (const lecon of unite.lecons) {
      const etat = etats.get(lecon.cle);
      const noeud = document.createElement(etat === "verrou" ? "span" : "a");
      noeud.className = `noeud ${etat}${lecon.revision ? " revision-unite" : ""}`;
      noeud.style.setProperty("--decalage", `${ZIGZAG[n++ % ZIGZAG.length]}px`);
      if (etat !== "verrou") noeud.href = `pages/lecon.html?cle=${encodeURIComponent(lecon.cle)}`;
      const icone = lecon.revision ? "🏆" : etat === "fait" ? "✓" : etat === "actuel" ? "★" : "🔒";
      noeud.innerHTML = `
        ${etat === "actuel" ? `<span class="infobulle">${lecon.revision ? "Révision !" : "Commencer"}</span>` : ""}
        <span class="rond">${icone}</span>
        <span class="noeud-titre">${lecon.titre}</span>`;
      noeud.setAttribute("aria-label", `${unite.titre}, ${lecon.titre}${etat === "verrou" ? " (verrouillée)" : ""}`);
      chemin.appendChild(noeud);
    }
    zone.appendChild(section);
  }
}

function afficherAlbum() {
  const p = profilActif();
  const zone = $("album");
  zone.innerHTML = "";
  if (p.autocollants.length === 0) {
    zone.innerHTML = `<p class="petit">Termine une leçon pour gagner ton premier autocollant !</p>`;
    return;
  }
  for (const a of p.autocollants) {
    const s = document.createElement("span");
    s.className = "autocollant";
    s.textContent = a;
    zone.appendChild(s);
  }
}

// Coopératif plutôt que compétitif : un objectif commun pour la semaine.
function afficherEquipe() {
  const membres = listerProfils().filter((p) => p.mode !== "bebe").map((p) => ({ p, s: statistiques(p) }));
  const total = membres.reduce((t, m) => t + m.s.xpSemaine, 0);
  const objectif = Math.max(50, membres.reduce((t, m) => t + m.p.objectif * 5, 0));
  $("f-texte").textContent = `${total} / ${objectif} XP`;
  $("f-barre").style.width = `${Math.min(100, (total / objectif) * 100)}%`;

  const zone = $("equipe");
  zone.innerHTML = "";
  const actif = profilActif();
  for (const { p, s } of membres) {
    const li = document.createElement("li");
    if (p.id === actif.id) li.className = "moi";
    li.innerHTML = `<span class="rang"></span><span class="qui"></span><span class="pts">+${s.xpSemaine} XP</span>`;
    li.querySelector(".rang").textContent = p.avatar;
    li.querySelector(".qui").textContent = `${p.nom}${s.serie ? ` · 🔥 ${s.serie}` : ""}`;
    zone.appendChild(li);
  }
}

function afficherAccueil() {
  const profil = profilActif();
  if (!profil) return afficherProfils();
  montrer("accueil");
  appliquerMode(profil.mode);
  afficherStats();
  afficherPhraseDuJour();
  if (profil.mode !== "bebe") afficherParcours();
  if (profil.mode === "enfant") afficherAlbum();
  afficherEquipe();
}

[unites, phrases] = await Promise.all([
  chargerParcours("data/vocabulaire/"),
  chargerRoutines("data/").then((routines) => routines.flatMap((r) => r.phrases)),
]);
afficherAccueil();
activerHorsLigne("./");
