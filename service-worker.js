// Mode hors-ligne : on garde en cache les fichiers de l'appli.
// Pensez à changer VERSION quand vous modifiez des fichiers, pour forcer la mise à jour.

const VERSION = "v15";
const FICHIERS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/profils.js",
  "./js/flashcards.js",
  "./js/accueil.js",
  "./js/lecon.js",
  "./js/parcours.js",
  "./js/pinyin.js",
  "./js/sons.js",
  "./js/micro.js",
  "./js/gamification.js",
  "./js/mascotte.js",
  "./js/visuel.js",
  "./assets/illustrations/famille/ayi.svg",
  "./assets/illustrations/famille/baba.svg",
  "./assets/illustrations/famille/baobao.svg",
  "./assets/illustrations/famille/didi.svg",
  "./assets/illustrations/famille/erzi.svg",
  "./assets/illustrations/famille/gege.svg",
  "./assets/illustrations/famille/jia.svg",
  "./assets/illustrations/famille/jiejie.svg",
  "./assets/illustrations/famille/laoshi.svg",
  "./assets/illustrations/famille/mama.svg",
  "./assets/illustrations/famille/meimei.svg",
  "./assets/illustrations/famille/nainai.svg",
  "./assets/illustrations/famille/nver.svg",
  "./assets/illustrations/famille/pengyou.svg",
  "./assets/illustrations/famille/shushu.svg",
  "./assets/illustrations/famille/waigong.svg",
  "./assets/illustrations/famille/waipo.svg",
  "./assets/illustrations/famille/yeye.svg",
  "./assets/illustrations/pronoms/ni.svg",
  "./assets/illustrations/pronoms/ta-elle.svg",
  "./assets/illustrations/pronoms/ta.svg",
  "./assets/illustrations/pronoms/wo.svg",
  "./assets/illustrations/pronoms/women.svg",
  "./js/quotidien.js",
  "./js/comptines.js",
  "./js/imagier.js",
  "./js/histoires.js",
  "./js/lexique.js",
  "./js/tons.js",
  "./js/quiz.js",
  "./pages/flashcards.html",
  "./pages/lecon.html",
  "./pages/quotidien.html",
  "./pages/comptines.html",
  "./pages/imagier.html",
  "./pages/histoires.html",
  "./pages/lexique.html",
  "./pages/tons.html",
  "./pages/quiz.html",
  "./assets/icons/icon.svg",
  "./assets/qr-code.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/apple-touch-icon.png",
  "./data/tons.json",
  "./data/quotidien.json",
  "./data/comptines.json",
  "./data/histoires.json",
  "./data/vocabulaire/index.json",
  "./data/vocabulaire/temps.json",
  "./data/vocabulaire/dehors.json",
  "./data/vocabulaire/maison.json",
  "./data/vocabulaire/decrire.json",
  "./data/vocabulaire/vetements.json",
  "./data/vocabulaire/objets.json",
  "./data/vocabulaire/petitsmots.json",
  "./data/vocabulaire/actions.json",
  "./data/vocabulaire/salutations.json",
  "./data/vocabulaire/animaux.json",
  "./data/vocabulaire/couleurs.json",
  "./data/vocabulaire/nombres.json",
  "./data/vocabulaire/famille.json",
  "./data/vocabulaire/nourriture.json",
  "./data/vocabulaire/corps.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
  );
  self.clients.claim();
});

// Réseau d'abord (pour avoir le contenu à jour), cache si pas de connexion.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
