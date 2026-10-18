// Page d'accueil : choix du profil, tableau de bord et parcours des leçons.

import { activerHorsLigne } from "./app.js";
import { chargerParcours, etatsLecons } from "./parcours.js";
import {
  listerProfils, ajouterProfil, choisirProfil, supprimerProfil, profilActif, changerMode,
  statistiques, leconsTerminees, motsARevoir, motsConnus,
} from "./profils.js";

const $ = (id) => document.getElementById(id);

// Décalage horizontal des leçons pour dessiner un chemin qui serpente.
const ZIGZAG = [0, 45, 70, 45, 0, -45, -70, -45];

let unites = [];

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
    tuile.innerHTML = `<span class="grand"></span><strong></strong><br><small>⭐ ${stats.xp} XP · 🔥 ${stats.serie} j${p.mode === "enfant" ? " · 🧒" : ""}</small>`;
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
  ajouterProfil(nom, $("avatar").value.trim() || "🙂", $("mode-enfant").checked ? "enfant" : "normal");
  e.target.reset();
  afficherAccueil();
});

$("b-profil").addEventListener("click", afficherProfils);

$("r-enfant").addEventListener("change", (e) => {
  changerMode(e.target.checked ? "enfant" : "normal");
  montrer("accueil");
});

// ---------- Tableau de bord ----------

function afficherStats() {
  const s = statistiques();
  $("s-serie").textContent = s.serie;
  $("s-xp").textContent = s.xp;
  $("s-mots").textContent = s.nbMots;
  $("o-texte").textContent = `${Math.min(s.xpJour, s.objectif)} / ${s.objectif} XP`;
  $("o-barre").style.width = `${Math.min(100, (s.xpJour / s.objectif) * 100)}%`;

  const nbRevision = motsARevoir().length;
  $("revision").classList.toggle("cache", nbRevision === 0);
  $("r-texte").textContent = `${nbRevision} mot${nbRevision > 1 ? "s" : ""} à revoir pour ne pas oublier`;
  $("r-enfant").checked = profilActif().mode === "enfant";
}

function afficherParcours() {
  const etats = etatsLecons(unites, leconsTerminees());
  const connus = motsConnus();
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
      <div class="chemin"></div>`;
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

function afficherClassement() {
  const zone = $("classement");
  zone.innerHTML = "";
  const medailles = ["🥇", "🥈", "🥉"];
  const actif = profilActif();
  listerProfils()
    .map((p) => ({ p, s: statistiques(p) }))
    .sort((a, b) => b.s.xpSemaine - a.s.xpSemaine)
    .forEach(({ p, s }, i) => {
      const li = document.createElement("li");
      if (p.id === actif.id) li.className = "moi";
      li.innerHTML = `<span class="rang">${medailles[i] ?? i + 1}</span><span class="qui"></span><span class="pts">${s.xpSemaine} XP</span>`;
      li.querySelector(".qui").textContent = `${p.avatar} ${p.nom}`;
      zone.appendChild(li);
    });
}

function afficherAccueil() {
  if (!profilActif()) return afficherProfils();
  montrer("accueil");
  afficherStats();
  afficherParcours();
  afficherClassement();
  document.querySelector(".noeud.actuel")?.scrollIntoView({ block: "center" });
}

unites = await chargerParcours("data/vocabulaire/");
afficherAccueil();
activerHorsLigne("./");
