// Page d'accueil : choix du profil puis tableau de bord en 4 onglets
// (Apprendre, Famille, Succès, Profil), adapté au type de profil.
// Les blocs portent un attribut data-modes qui liste les profils concernés.

import { prononcer, activerHorsLigne, appliquerTheme, changerSombre, preferenceSombre, verifierVoixChinoise } from "./app.js";
import { chargerParcours, chargerRoutines, etatsLecons } from "./parcours.js";
import {
  listerProfils, ajouterProfil, choisirProfil, supprimerProfil, profilActif, changerMode, changerObjectif,
  statistiques, leconsTerminees, motsARevoir, motsConnus, phrasesDitesAujourdhui, marquerPhraseDite, aujourdhui,
  motsDeLaSemaine, exporterDonnees, importerDonnees, reinitialiserProfilActif, effacerTout,
} from "./profils.js";
import { rubyHTML } from "./pinyin.js";
import { mascotte } from "./mascotte.js";
import { NIVEAUX, BADGES, niveauPour, quetesDuJour, ouvrirCoffre, evenement, verifierBadges } from "./gamification.js";

const $ = (id) => document.getElementById(id);
const MODES = { adulte: "🧑 Adulte", enfant: "🧒 Enfant 3-6 ans", bebe: "👶 Bébé 0-2 ans" };

// Décalage horizontal des leçons pour dessiner un chemin qui serpente.
const ZIGZAG = [0, 50, 75, 50, 0, -50, -75, -50];
const DECORS = ["🏮", "🎋", "🐉", "🧧", "🥮", "🍵", "🪁", "🌸"];

let unites = [];
let phrases = [];
let dictionnaire = new Map(); // id → mot ou phrase

function montrer(ecran) {
  $("ecran-bienvenue").classList.toggle("cache", ecran !== "bienvenue");
  $("ecran-profils").classList.toggle("cache", ecran !== "profils");
  $("ecran-accueil").classList.toggle("cache", ecran !== "accueil");
  $("onglets").classList.toggle("cache", ecran !== "accueil");
  document.body.classList.toggle("avec-onglets", ecran === "accueil");
}

// ---------- Premier lancement ----------

const CLE_BIENVENUE = "mandarin-famille-bienvenue";
let diapo = 0;

function afficherBienvenue() {
  $("mascotte-bienvenue").innerHTML = mascotte("bravo", "saute");
  montrer("bienvenue");
}

function finirBienvenue() {
  try { localStorage.setItem(CLE_BIENVENUE, "1"); } catch { /* pas de stockage */ }
  afficherProfils();
}

$("bienvenue-suivant").addEventListener("click", () => {
  if (diapo === 2) return finirBienvenue();
  diapo++;
  document.querySelectorAll(".diapo").forEach((d) => d.classList.toggle("cache", Number(d.dataset.diapo) !== diapo));
  document.querySelectorAll("#points i").forEach((p, i) => p.classList.toggle("actif", i === diapo));
  $("mascotte-bienvenue").innerHTML = mascotte(["bravo", "parle", "content"][diapo], "respire");
  if (diapo === 2) $("bienvenue-suivant").textContent = "Créer mon profil";
});
$("bienvenue-passer").addEventListener("click", finirBienvenue);

// ---------- Profils ----------

function afficherProfils() {
  appliquerTheme();
  $("mascotte-profils").innerHTML = mascotte("content", "respire");
  const actif = profilActif();
  const zone = $("profils");
  zone.innerHTML = "";
  for (const p of listerProfils()) {
    const stats = statistiques(p);
    const niveau = niveauPour(p.xp);
    const tuile = document.createElement("button");
    tuile.className = "tuile" + (actif?.id === p.id ? " active" : "");
    const detail = p.mode === "bebe" ? "👶 avec un parent" : `${niveau.emoji} Niv. ${niveau.numero} · 🔥 ${stats.serie}`;
    tuile.innerHTML = `<span class="grand"></span><strong></strong><br><small>${detail}</small>`;
    tuile.querySelector(".grand").textContent = p.avatar;
    tuile.querySelector("strong").textContent = p.nom;
    tuile.addEventListener("click", () => { choisirProfil(p.id); afficherAccueil("apprendre"); });
    tuile.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Supprimer le profil ${p.nom} et toute sa progression ?`)) { supprimerProfil(p.id); afficherProfils(); }
    });
    zone.appendChild(tuile);
  }
  $("pastilles").classList.add("cache");
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
  afficherAccueil("apprendre");
});

$("b-changer").addEventListener("click", afficherProfils);
$("r-mode").addEventListener("change", (e) => { changerMode(e.target.value); afficherAccueil("profil"); });
$("r-objectif").addEventListener("change", (e) => { changerObjectif(Number(e.target.value)); afficherAccueil("profil"); });

// ---------- Onglets ----------

function ouvrirOnglet(nom) {
  for (const section of document.querySelectorAll(".onglet-contenu")) {
    section.classList.toggle("cache", section.id !== `onglet-${nom}`);
  }
  for (const b of document.querySelectorAll(".onglet")) b.classList.toggle("actif", b.dataset.cible === nom);
  history.replaceState(null, "", `#${nom}`);
  scrollTo(0, 0);
}
for (const b of document.querySelectorAll(".onglet")) b.addEventListener("click", () => ouvrirOnglet(b.dataset.cible));

function appliquerMode(mode) {
  for (const bloc of document.querySelectorAll("[data-modes]")) {
    bloc.classList.toggle("cache", !bloc.dataset.modes.split(" ").includes(mode));
  }
  $("nom-onglet-famille").textContent = mode === "enfant" ? "Jeux" : "Famille";
}

// ---------- En-tête et salutation ----------

function afficherEntete() {
  const p = profilActif();
  const s = statistiques();
  const niveau = niveauPour(p.xp);
  const bebe = p.mode === "bebe";
  $("pastilles").classList.toggle("cache", bebe);
  $("sous-titre").textContent = bebe ? `${p.avatar} ${p.nom}` : "宝宝";
  $("p-niveau").textContent = `${niveau.emoji} ${niveau.numero}`;
  $("p-serie").textContent = `🔥 ${s.serie}`;
  $("p-serie").classList.toggle("eteinte", s.xpJour === 0);
  $("p-xp").textContent = `⭐ ${s.xp}`;
}

function texteSalut(p, s, quetes) {
  const heure = new Date().getHours();
  const bonjour = heure < 12 ? "早上好 zǎoshang hǎo" : heure < 18 ? "你好 nǐ hǎo" : "晚上好 wǎnshang hǎo";
  if (p.mode === "bebe") return `${bonjour} ! Aujourd'hui, chantons une comptine avec ${p.nom} ?`;
  if (p.mode === "enfant") return s.xpJour === 0 ? `${bonjour} ${p.nom} ! On joue ensemble ? 🎈` : `Bravo ${p.nom} ! Tu as gagné ${s.xpJour} étoiles aujourd'hui ⭐`;
  if (s.xpJour === 0) return `${bonjour}, ${p.nom} ! Une petite leçon pour lancer la journée ?`;
  if (s.xpJour < s.objectif) return `Plus que ${s.objectif - s.xpJour} XP pour ton objectif du jour. 加油 jiāyóu !`;
  if (quetes && !quetes.toutesFaites) return "Objectif atteint ! Il reste des quêtes pour ouvrir le coffre 🎁";
  return "Journée parfaite ! Pense à dire une phrase en chinois à tes enfants 💬";
}

function afficherSalut() {
  const p = profilActif();
  const s = statistiques();
  const quetes = quetesDuJour();
  const humeur = p.mode !== "bebe" && s.xpJour >= s.objectif ? "bravo" : "content";
  $("mascotte-salut").innerHTML = mascotte(humeur, humeur === "bravo" ? "saute" : "respire");
  $("salut-texte").textContent = texteSalut(p, s, quetes);
}

// ---------- Onglet Apprendre ----------

function afficherObjectif() {
  const s = statistiques();
  const ratio = Math.min(1, s.xpJour / s.objectif);
  const circonference = 2 * Math.PI * 42;
  const plein = $("anneau-plein");
  plein.style.strokeDasharray = circonference;
  plein.style.strokeDashoffset = circonference * (1 - ratio);
  $("anneau").classList.toggle("complet", ratio >= 1);
  $("anneau-xp").textContent = s.xpJour;
  $("anneau-obj").textContent = `/ ${s.objectif} XP`;
  $("objectif-texte").textContent = ratio >= 1 ? "Bravo, objectif atteint ! 🎉" : `Encore ${s.objectif - s.xpJour} XP, environ ${Math.ceil((s.objectif - s.xpJour) / 10)} leçon(s).`;

  const nbRevision = motsARevoir().length;
  $("revision").classList.toggle("cache", nbRevision === 0 || profilActif().mode === "bebe");
  $("r-texte").textContent = `${nbRevision} élément${nbRevision > 1 ? "s" : ""} à revoir pour ne pas oublier`;
}

function afficherQuetes() {
  const quetes = quetesDuJour();
  if (!quetes) return;
  const zone = $("quetes");
  zone.innerHTML = "";
  for (const q of quetes.liste) {
    // Tuile « verre qui se remplit » : le liquide monte avec la progression.
    const pourcent = Math.min(100, Math.round((q.progres / q.objectif) * 100));
    const div = document.createElement("div");
    div.className = `quete${q.fait ? " faite" : ""}`;
    div.innerHTML = `<div class="quete-titre"><span class="quete-emoji">${q.fait ? "✅" : q.emoji}</span><span class="quete-texte"></span></div>
      <div class="quete-verre"><span class="quete-liquide" style="height:${Math.max(pourcent, 6)}%"></span>
        <strong class="quete-compte">${q.objectif > 1 ? `${Math.min(q.progres, q.objectif)}/${q.objectif}` : `${pourcent}%`}</strong></div>`;
    div.querySelector(".quete-texte").textContent = q.texte;
    zone.appendChild(div);
  }
  const coffre = $("coffre");
  const pret = quetes.toutesFaites && !quetes.coffre;
  coffre.classList.toggle("pret", pret);
  $("coffre-ouvrir").classList.toggle("cache", !pret);
  coffre.querySelector(".coffre-emoji").textContent = quetes.coffre ? "🪙" : "🎁";
  $("coffre-texte").textContent = quetes.coffre
    ? "Coffre ouvert ! Reviens demain pour de nouvelles quêtes."
    : pret ? "Toutes les quêtes sont réussies !" : "Réussis les 3 quêtes pour ouvrir le coffre !";
}

$("coffre-ouvrir").addEventListener("click", () => {
  const gain = ouvrirCoffre();
  if (gain) {
    $("coffre-texte").textContent = `+${gain} XP ! 🎉`;
    confettis();
    setTimeout(() => afficherAccueil("apprendre"), 1400);
  }
});

function afficherParcours() {
  const etats = etatsLecons(unites, leconsTerminees());
  const connus = motsConnus();
  const enfant = profilActif().mode === "enfant";
  const zone = $("parcours");
  zone.innerHTML = "";
  let n = 0;
  let etapeCourante = null;

  for (const unite of unites) {
    // Titre d'étape (« Étape 1 · Les premiers mots »…) quand on change d'étape.
    if (unite.section && unite.section !== etapeCourante) {
      etapeCourante = unite.section;
      const titre = document.createElement("h2");
      titre.className = "titre-etape";
      titre.textContent = unite.section;
      zone.appendChild(titre);
    }
    const section = document.createElement("section");
    section.className = "unite";
    section.style.setProperty("--couleur", unite.couleur);
    const vus = unite.mots.filter((m) => connus.has(m.id)).length;
    section.innerHTML = `
      <div class="unite-entete">
        <small>Unité ${unite.numero}</small>
        <h3>${unite.emoji} ${unite.titre}</h3>
        <small>${vus} / ${unite.mots.length} mots découverts</small>
      </div>
      ${unite.note && !enfant ? `<details class="note-unite"><summary>📖 À savoir</summary><p></p></details>` : ""}
      <div class="chemin"></div>`;
    if (unite.note && !enfant) section.querySelector(".note-unite p").textContent = unite.note;
    // Test de passage pour les adultes qui connaissent déjà une unité verrouillée.
    if (!enfant && etats.get(unite.lecons[0].cle) === "verrou") {
      const test = document.createElement("a");
      test.className = "bouton-test";
      test.href = `pages/lecon.html?test=${unite.id}`;
      test.textContent = "⏩ Je connais déjà : passer le test";
      section.querySelector(".unite-entete").appendChild(test);
    }
    const chemin = section.querySelector(".chemin");

    unite.lecons.forEach((lecon, i) => {
      const etat = etats.get(lecon.cle);
      const decalage = ZIGZAG[n++ % ZIGZAG.length];
      const noeud = document.createElement(etat === "verrou" ? "span" : "a");
      noeud.className = `noeud ${etat}${lecon.revision ? " revision-unite" : ""}`;
      noeud.style.setProperty("--decalage", `${decalage}px`);
      if (etat !== "verrou") noeud.href = `pages/lecon.html?cle=${encodeURIComponent(lecon.cle)}`;
      const icone = lecon.revision ? "🏆" : etat === "fait" ? "✓" : etat === "actuel" ? "★" : "🔒";
      noeud.innerHTML = `
        ${etat === "actuel" ? `<span class="infobulle">${lecon.revision ? "Révision !" : "Commencer"}</span>` : ""}
        <span class="rond">${icone}</span>
        <span class="noeud-titre">${lecon.titre}</span>`;
      noeud.setAttribute("aria-label", `${unite.titre}, ${lecon.titre}${etat === "verrou" ? " (verrouillée)" : ""}`);
      // Bao attend à côté de la leçon à faire, un décor chinois de l'autre côté sinon.
      if (etat === "actuel") {
        const bao = document.createElement("span");
        bao.className = "mascotte-chemin";
        bao.style[decalage >= 0 ? "right" : "left"] = "100%";
        bao.innerHTML = mascotte("content", "respire");
        noeud.appendChild(bao);
      } else if (i === 1) {
        const deco = document.createElement("span");
        deco.className = "deco";
        deco.style[decalage >= 0 ? "right" : "left"] = "calc(100% + 30px)";
        deco.style.top = "8px";
        deco.textContent = DECORS[unite.numero % DECORS.length];
        noeud.appendChild(deco);
      }
      chemin.appendChild(noeud);
    });
    zone.appendChild(section);
  }
}

// ---------- Onglet Famille ----------

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
  dite.onclick = () => {
    if (marquerPhraseDite(phrase.id)) evenement("phrase");
    maj();
    afficherEntete();
    afficherEquipe();
  };
  maj();
  // Sur un profil bébé, c'est le parent qui parle : les XP vont sur son propre profil.
  dite.classList.toggle("cache", profilActif().mode === "bebe");
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
    li.querySelector(".qui").textContent = `${p.nom} · ${niveauPour(p.xp).emoji}${s.serie ? ` · 🔥 ${s.serie}` : ""}`;
    zone.appendChild(li);
  }
}

// ---------- Onglet Succès ----------

function afficherSucces() {
  const p = profilActif();
  const niveau = niveauPour(p.xp);
  $("niveau-emoji").textContent = niveau.emoji;
  $("niveau-numero").textContent = niveau.numero;
  $("niveau-nom").innerHTML = `${niveau.nom} <span class="hanzi-niveau">${niveau.hanzi}</span> <small class="petit">${niveau.pinyin}</small>`;
  $("niveau-barre").style.width = `${niveau.progression * 100}%`;
  $("niveau-suivant").textContent = niveau.suivant
    ? `Encore ${niveau.xpPourSuivant - niveau.xpDansNiveau} XP pour devenir ${niveau.suivant.emoji} ${niveau.suivant.nom}`
    : "Tu as atteint le plus haut niveau. 了不起 liǎobuqǐ !";
  $("zodiaque").innerHTML = NIVEAUX.map((n, i) => `<span class="${i < niveau.numero ? "atteint" : ""}" title="${n.nom} ${n.hanzi}">${n.emoji}</span>`).join("");

  const zone = $("badges");
  zone.innerHTML = "";
  for (const b of BADGES) {
    if (b.id === "album" && p.mode !== "enfant") continue;
    const obtenu = p.badges.includes(b.id);
    const div = document.createElement("div");
    div.className = `badge${obtenu ? " obtenu" : ""}`;
    div.innerHTML = `<div class="badge-medaille">${obtenu ? b.emoji : "🔒"}</div><strong></strong><small></small>`;
    div.querySelector("strong").textContent = b.titre;
    div.querySelector("small").textContent = b.texte;
    zone.appendChild(div);
  }

  if (p.mode === "enfant") {
    const album = $("album");
    album.innerHTML = "";
    for (const a of p.autocollants) {
      const s = document.createElement("span");
      s.className = "autocollant";
      s.textContent = a;
      album.appendChild(s);
    }
    // Emplacements vides : donne envie de compléter l'album.
    for (let i = p.autocollants.length; i < Math.max(8, p.autocollants.length + 2); i++) {
      const s = document.createElement("span");
      s.className = "autocollant vide";
      s.textContent = "?";
      album.appendChild(s);
    }
  }
}

// ---------- Onglet Profil ----------

function afficherProfil() {
  const p = profilActif();
  const s = statistiques();
  $("profil-avatar").textContent = p.avatar;
  $("profil-nom").textContent = p.nom;
  $("profil-resume").textContent = p.mode === "bebe"
    ? MODES[p.mode]
    : `${MODES[p.mode]} · ${s.nbMots} mots et phrases appris · ${p.badges.length} badge(s)`;
  $("r-mode").value = p.mode;
  $("r-objectif").value = String(p.objectif);
  $("r-sombre").value = preferenceSombre();

  // Bilan de la semaine : utile au parent pour réutiliser les mots avec l'enfant.
  const semaine = motsDeLaSemaine().map((id) => dictionnaire.get(id)).filter(Boolean);
  $("bilan-semaine").classList.toggle("cache", p.mode === "bebe");
  $("bilan-texte").textContent = semaine.length
    ? p.mode === "enfant"
      ? `${p.nom} a découvert ${semaine.length} mot(s) cette semaine. Dites-les-lui dans la journée : touchez un mot pour l'entendre.`
      : `${semaine.length} nouveau(x) mot(s) et phrase(s) cette semaine. Touchez pour réécouter.`
    : "Aucun nouveau mot cette semaine pour l'instant. Une petite leçon ?";
  const zone = $("bilan-mots");
  zone.innerHTML = "";
  for (const m of semaine.slice(0, 40)) {
    const puce = document.createElement("button");
    puce.className = "puce-mot";
    puce.innerHTML = `${m.emoji} ${rubyHTML(m.hanzi, m.pinyin)}`;
    puce.title = m.fr;
    puce.addEventListener("click", () => prononcer(m.hanzi));
    zone.appendChild(puce);
  }
}

$("r-sombre").addEventListener("change", (e) => changerSombre(e.target.value));

// ---------- Sauvegarde ----------

$("exporter").addEventListener("click", () => {
  const blob = new Blob([exporterDonnees()], { type: "application/json" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `baobao-${aujourdhui()}.json`;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  $("sauvegarde-info").textContent = "✅ Fichier enregistré dans tes téléchargements.";
});
// ---------- Partage ----------

const LIEN_APPLI = "https://pascaltea.github.io/baobao/";
const MESSAGE_PARTAGE = "🐼 On apprend le chinois en famille avec BaoBao ! Leçons de 5 minutes, phrases à dire aux enfants, comptines… Gratuit et sans pub. Ouvre le lien, puis « Ajouter à l'écran d'accueil » pour l'installer :";

async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; } catch { return false; }
}

// Partage natif du téléphone (WhatsApp, SMS, e-mail…), sinon copie du message.
$("partager").addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share({ title: "BaoBao 宝宝 · Le chinois en famille", text: MESSAGE_PARTAGE, url: LIEN_APPLI }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  $("partage-info").textContent = (await copier(`${MESSAGE_PARTAGE} ${LIEN_APPLI}`))
    ? "✅ Message copié : colle-le dans WhatsApp, un SMS ou un e-mail."
    : `Copie ce lien : ${LIEN_APPLI}`;
});
$("copier-lien").addEventListener("click", async () => {
  $("partage-info").textContent = (await copier(LIEN_APPLI)) ? "✅ Lien copié !" : `Copie ce lien : ${LIEN_APPLI}`;
});

// ---------- Réinitialisation ----------

$("reinit-profil").addEventListener("click", () => {
  const p = profilActif();
  if (!confirm(`Recommencer à zéro pour ${p.nom} ? Mots appris, leçons, XP, série et badges seront effacés. Le profil est conservé.`)) return;
  reinitialiserProfilActif();
  afficherAccueil("apprendre");
});

$("supprimer-profil").addEventListener("click", () => {
  const p = profilActif();
  if (!confirm(`Supprimer le profil ${p.nom} et toute sa progression ?`)) return;
  supprimerProfil(p.id);
  listerProfils().length ? afficherAccueil("apprendre") : afficherProfils();
});

$("effacer-tout").addEventListener("click", () => {
  if (!confirm("Tout effacer sur cet appareil ? Tous les profils, la progression et les réglages seront supprimés.")) return;
  if (!confirm("Vraiment tout effacer ? Cette action est définitive (sauf si tu as une sauvegarde).")) return;
  effacerTout();
  location.href = location.pathname; // repart du premier lancement
});

const demanderImport = () => $("fichier-import").click();
$("importer").addEventListener("click", demanderImport);
$("restaurer-accueil").addEventListener("click", demanderImport);
$("fichier-import").addEventListener("change", async (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;
  try {
    const nb = importerDonnees(await fichier.text());
    alert(`Sauvegarde restaurée : ${nb} profil(s).`);
    afficherAccueil("apprendre");
  } catch (erreur) {
    alert(erreur.message || "Fichier illisible.");
  }
  e.target.value = "";
});

// ---------- Effets ----------

function confettis() {
  const couleurs = ["#e8423f", "#ffc83d", "#2bb673", "#33b5f0", "#8e6cef"];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = couleurs[i % couleurs.length];
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

// ---------- Assemblage ----------

function afficherAccueil(onglet) {
  const profil = profilActif();
  if (!profil) return afficherProfils();
  appliquerTheme();
  verifierBadges();
  montrer("accueil");
  appliquerMode(profil.mode);
  afficherEntete();
  afficherSalut();
  afficherPhraseDuJour();
  afficherEquipe();
  afficherProfil();
  if (profil.mode !== "bebe") {
    afficherObjectif();
    afficherQuetes();
    afficherParcours();
    afficherSucces();
  }
  const demande = onglet ?? location.hash.slice(1);
  const disponible = ["apprendre", "famille", "profil", ...(profil.mode !== "bebe" ? ["succes"] : [])];
  ouvrirOnglet(disponible.includes(demande) ? demande : "apprendre");
}

[unites, phrases] = await Promise.all([
  chargerParcours("data/vocabulaire/"),
  chargerRoutines("data/").then((routines) => routines.flatMap((r) => r.phrases)),
]);
dictionnaire = new Map([...unites.flatMap((u) => u.mots), ...phrases].map((m) => [m.id, m]));

let dejaVu = false;
try { dejaVu = !!localStorage.getItem(CLE_BIENVENUE); } catch { /* pas de stockage */ }
if (!listerProfils().length && !dejaVu) afficherBienvenue();
else afficherAccueil();
activerHorsLigne("./");

verifierVoixChinoise().then((ok) => $("alerte-voix").classList.toggle("cache", ok));
