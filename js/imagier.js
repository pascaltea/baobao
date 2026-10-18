// Imagier : de grandes images à regarder avec un parent. On touche l'image pour
// entendre le mot. Après 5 minutes, une pause propose une activité sans écran
// (l'OMS déconseille les écrans avant 2 ans : l'imagier est un support d'échange,
// pas une activité en solo).

import { chargerJSON, prononcer, afficherProfilActif, activerHorsLigne } from "./app.js";
import { pinyinColore } from "./pinyin.js";
import { evenement } from "./gamification.js";

const DATA = "../data/vocabulaire/";
const DUREE = 5 * 60 * 1000;
const $ = (id) => document.getElementById(id);

const IDEES = {
  salutations: "Dites 你好 nǐ hǎo et 再见 zàijiàn à chaque arrivée et chaque départ de la journée, en faisant coucou de la main.",
  animaux: "Imitez les animaux ensemble : 猫 māo… « miaou ! », 狗 gǒu… « ouaf ! ». Cherchez-les dans un vrai livre ou dehors.",
  couleurs: "Partez à la chasse aux couleurs dans la maison : touchez un objet rouge en disant 红色 hóngsè !",
  nombres: "Comptez les marches de l'escalier, les doigts, les cuillères : 一、二、三 yī, èr, sān !",
  famille: "Regardez des photos de famille en nommant chacun : 妈妈, 爸爸, 奶奶, 爷爷…",
  nourriture: "Au prochain repas, nommez ce qu'il y a dans l'assiette : 苹果 píngguǒ, 米饭 mǐfàn, 水 shuǐ…",
  corps: "Jouez à « touche ton… » : 鼻子 bízi (nez) ! 嘴巴 zuǐba (bouche) ! 手 shǒu (main) !",
  actions: "Jouez à « Jacques a dit » en chinois : 跑 pǎo (cours) ! 坐 zuò (assieds-toi) ! 看 kàn (regarde) !",
  petitsmots: "Montrez des objets en demandant 这是什么 ? zhè shì shénme (qu'est-ce que c'est ?) et répondez ensemble.",
  objets: "Rangez les jouets en les nommant : 球 qiú, 车 chē, 书 shū… et dites 给我 gěi wǒ (donne-moi) !",
  vetements: "À l'habillage, nommez chaque vêtement avant de le mettre : 袜子 wàzi, 裤子 kùzi, 鞋子 xiézi…",
  decrire: "Comparez des objets : un grand 大 dà et un petit 小 xiǎo, chaud 热 rè ou froid 冷 lěng.",
  maison: "Faites le tour de la maison en nommant les pièces : 厨房 chúfáng, 浴室 yùshì, 门 mén…",
  dehors: "En promenade, montrez le ciel : 太阳 tàiyáng, 云 yún, 树 shù, 花 huā !",
  temps: "Le soir, racontez la journée : 今天 jīntiān on a joué, 明天 míngtiān on ira au parc…",
};

let themes = [];
let mots = [];
let position = 0;
let themeActuel = null;
let minuteur = null;

function demarrerMinuteur(duree) {
  clearTimeout(minuteur);
  minuteur = setTimeout(() => {
    $("pause-idee").textContent = IDEES[themeActuel] ?? IDEES.animaux;
    $("pause").classList.remove("cache");
  }, duree);
}

function afficherThemes() {
  const zone = $("themes");
  zone.innerHTML = "";
  for (const t of themes) {
    const tuile = document.createElement("button");
    tuile.className = "tuile";
    tuile.innerHTML = `<span class="grand">${t.emoji}</span><strong>${t.titre}</strong>`;
    tuile.addEventListener("click", () => ouvrir(t));
    zone.appendChild(tuile);
  }
}

async function ouvrir(theme) {
  themeActuel = theme.id;
  evenement("imagier");
  mots = await chargerJSON(DATA + theme.fichier);
  position = 0;
  $("themes-imagier").classList.add("cache");
  $("visionneuse").classList.remove("cache");
  afficherImage();
  if (!minuteur) demarrerMinuteur(DUREE);
}

function afficherImage() {
  const mot = mots[position];
  $("ii-emoji").textContent = mot.emoji;
  $("ii-hanzi").textContent = mot.hanzi;
  $("ii-fr").innerHTML = `${$("voir-pinyin").checked ? pinyinColore(mot.pinyin, mot.hanzi) + " · " : ""}${mot.fr}`;
  $("position").textContent = `${position + 1} / ${mots.length}`;
  const image = $("image");
  image.classList.remove("rebond");
  void image.offsetWidth;
  image.classList.add("rebond");
  prononcer(mot.hanzi, 0.7);
}

function aller(sens) {
  position = (position + sens + mots.length) % mots.length;
  afficherImage();
}

$("image").addEventListener("click", () => {
  const image = $("image");
  image.classList.remove("rebond");
  void image.offsetWidth;
  image.classList.add("rebond");
  prononcer(mots[position].hanzi, 0.7);
});
$("precedent").addEventListener("click", () => aller(-1));
$("suivant").addEventListener("click", () => aller(1));
$("voir-pinyin").addEventListener("change", afficherImage);
$("fermer").addEventListener("click", () => {
  $("visionneuse").classList.add("cache");
  $("themes-imagier").classList.remove("cache");
});

// Glisser à gauche / à droite pour changer d'image.
let departX = null;
$("image").addEventListener("touchstart", (e) => { departX = e.touches[0].clientX; }, { passive: true });
$("image").addEventListener("touchend", (e) => {
  if (departX === null) return;
  const ecart = e.changedTouches[0].clientX - departX;
  if (Math.abs(ecart) > 50) aller(ecart < 0 ? 1 : -1);
  departX = null;
});

$("pause-ok").addEventListener("click", () => { location.href = "../index.html"; });
$("pause-encore").addEventListener("click", () => {
  $("pause").classList.add("cache");
  demarrerMinuteur(2 * 60 * 1000);
});

afficherProfilActif();
activerHorsLigne("../");
themes = await chargerJSON(`${DATA}index.json`);
afficherThemes();
