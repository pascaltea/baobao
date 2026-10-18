<p align="center"><img src="assets/logo.svg" alt="BaoBao 宝宝 · Le chinois en famille" width="420"></p>

# BaoBao 宝宝 · Le chinois en famille

Application web pour apprendre le chinois mandarin en famille avec **Bao**, le panda,
inspirée de Duolingo, sans publicité, sans abonnement et sans « vies » perdues.

Le nom vient de 宝宝 bǎobao, « bébé, mon trésor » : un des premiers mots que les
parents chinois disent à leurs enfants.

👉 **https://pascaltea.github.io/baobao/**

## Pour qui ?

| Profil | Ce qu'il propose |
|---|---|
| 🧑 **Adulte** | Parcours de leçons, phrases du quotidien à dire aux enfants, comptines, révisions |
| 🧒 **Enfant 3-6 ans** | Leçons courtes avec images et sons (sans lecture), imagier, comptines, autocollants |
| 👶 **Bébé 0-2 ans** | Pas d'exercices : imagier à regarder avec un parent (5 min max), comptines. C'est le parent qui parle ! |

## Fonctionnalités

### Avec mes enfants
- 💬 **Au quotidien** : 67 phrases pour 11 moments de la journée (réveil, repas, habillage,
  dehors, jeu, bain, coucher, émotions, pot, voiture, courses), avec des conseils pour les parents, l'audio,
  « Je répète » au micro et « Je l'ai dite ! » (+2 XP quand on l'utilise pour de vrai)
- 🌅 **Phrase du jour** à dire aux enfants
- 🎶 **Comptines** traditionnelles (两只老虎, 小星星, 上山打老虎, 生日快乐) avec pinyin,
  traduction et l'air à chanter
- 🖼️ **Imagier** plein écran à regarder ensemble, avec une pause sans écran après 5 minutes
- 📚 **Histoires** courtes à lire aux enfants, page par page, avec une question de compréhension

### Apprendre (adultes)
- 🗺️ **Parcours** : 221 mots en 15 unités et 4 étapes, dans l'ordre où les enfants chinois
  apprennent les mots (famille d'abord, puis besoins et actions, mots du quotidien…)
- ⏩ **Test de passage** pour valider d'un coup une unité déjà connue
- 📖 **Notes « À savoir »** de grammaire en tête de chaque unité
- ✨ **Découverte** de chaque mot : pinyin coloré par ton, audio normal et 🐢 lent,
  astuce mnémotechnique, 🎙️ enregistrement de sa voix pour comparer
- 🧩 **Exercices** : écoute → image, écoute → sens, caractère → sens, image → caractère,
  bon pinyin (tons), paires, et **remettre la phrase dans l'ordre**
- 🧠 **Répétition espacée** et révision du jour
- 📒 **Mes mots** : lexique avec recherche et jauge de mémoire pour chaque mot

### Rester motivé, sans pression
- 🐼 **Bao**, le panda mascotte : il salue, parle pendant les exercices d'écoute,
  saute de joie ou console après une erreur
- 🏮 **Niveaux du zodiaque chinois** : on progresse du Rat 鼠 au Cochon 猪, puis Grand maître
- ⚔️ **Quêtes du jour** (dont « dis une phrase à tes enfants ») et 🎁 coffre à ouvrir
- 🏆 **16 badges** à débloquer, 🌟 album d'autocollants pour les enfants
- ⭐ XP, 🔥 série (un jour de repos ne la casse pas), 🎯 objectif réglable
- 🤝 **Équipe famille** : un objectif commun de la semaine plutôt qu'un classement
- Pas de vies, pas de pub, pas d'abonnement, utilisable hors-ligne

### Design
Inspiré de Duolingo (boutons en relief, chemin, mascotte), de Khan Academy Kids et
Lingokids (thème ciel pastel et grandes zones tactiles pour les enfants) et de
Headspace (sobriété pour les adultes). Navigation par onglets comme une appli mobile,
vibrations, sons et confettis.

Voir [docs/critiques.md](docs/critiques.md) : les critiques faites à Duolingo et aux
autres applis, et comment l'appli y répond.

### Partager
- 💌 **Inviter la famille** (onglet Famille) : partage natif du téléphone, lien à copier et
  QR code à scanner. Joli aperçu avec Bao dans WhatsApp, Messenger, etc.
- Chacun apprend sur son propre téléphone, sans compte, et garde sa progression.

### Confort
- 👋 Premier lancement guidé par Bao
- 💾 **Sauvegarde / restauration** de toute la famille (fichier), pour changer d'appareil
- 📅 **Bilan de la semaine** : les mots découverts, pour les réutiliser avec les enfants
- 🌙 **Mode sombre** (automatique ou manuel) pour les révisions du soir
- 🔇 Alerte et mode d'emploi si aucune voix chinoise n'est installée, choix automatique de la meilleure voix
- ♿ Focus clavier visible, animations réduites si le téléphone le demande

📱 Installable sur téléphone/tablette (PWA). La progression est enregistrée dans le
navigateur de chaque appareil (pensez à la sauvegarder).

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
index.html              accueil : profils, tableau de bord, parcours
pages/lecon.html        une leçon (découverte + exercices)
pages/quotidien.html    phrases du quotidien à dire aux enfants
pages/comptines.html    comptines
pages/imagier.html      imagier pour les petits
pages/histoires.html    histoires
pages/lexique.html      « Mes mots » : lexique et mémoire
pages/                  entraînement libre (flashcards, tons, quiz)
css/style.css           styles
js/
  accueil.js            page d'accueil et parcours
  lecon.js              moteur de leçon (exercices, corrections, bilan)
  parcours.js           découpage des thèmes en unités et leçons
  profils.js            profils, XP, série, répétition espacée
  pinyin.js             syllabes, couleurs des tons, variantes de tons
  sons.js               petits sons de jeu
  micro.js              « Je répète » : enregistrement et comparaison
  gamification.js       niveaux, quêtes du jour, coffre, badges, notifications
  mascotte.js           Bao le panda (SVG animé, plusieurs expressions)
data/vocabulaire/       le contenu, un fichier JSON par thème
data/tons.json          séries de mots pour l'exercice des tons
data/quotidien.json     routines et phrases du quotidien
data/comptines.json     paroles des comptines
data/histoires.json     histoires courtes et questions
docs/idees.md           roadmap et idées
```

## Vérifier la lisibilité

`outils/audit-contraste.mjs` mesure le contraste de chaque texte visible (norme WCAG AA)
sur toutes les pages, en mode clair, en mode sombre et en thème enfant :

```bash
python3 -m http.server 8000 &
npm install playwright   # une seule fois
node outils/audit-contraste.mjs http://localhost:8000/
```

## Ajouter du vocabulaire

1. Créer ou compléter un fichier dans `data/vocabulaire/` :

   ```json
   {"id": "mao", "hanzi": "猫", "pinyin": "māo", "fr": "chat", "emoji": "🐱", "astuce": "Le chat dit « miaou »…"}
   ```

   `astuce` est facultative. L'`id` doit être unique dans toute l'appli.

2. Pour un nouveau thème, l'ajouter dans `data/vocabulaire/index.json` :
   il devient automatiquement une nouvelle unité du parcours.

3. Ajouter le fichier à la liste de `service-worker.js` et augmenter `VERSION`.

## Déploiement

Publication automatique sur GitHub Pages à chaque push sur `main`
(workflow `.github/workflows/deploy.yml`).
