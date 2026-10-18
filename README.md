# 学中文 · Mandarin en famille

Application web pour apprendre le chinois mandarin en famille, inspirée de
Duolingo, sans publicité, sans abonnement et sans « vies » perdues.

👉 **https://pascaltea.github.io/mandarin-famille/**

## Fonctionnalités

### Apprendre
- 🗺️ **Parcours** : 7 unités (salutations, animaux, couleurs, nombres, famille,
  nourriture, corps), découpées en leçons de 4-5 mots qui se débloquent une à une,
  avec une révision 🏆 à la fin de chaque unité.
- ✨ **Découverte des mots** : chaque nouveau mot est présenté avant d'être pratiqué :
  caractère, pinyin **coloré selon le ton**, audio normal et 🐢 lent, emoji et
  astuce mnémotechnique du panda 🐼.
- 🧩 **6 types d'exercices**, du plus facile au plus difficile : écoute → image,
  caractère → sens, image → caractère, écoute → caractère, bon pinyin (tons) et
  association de paires. Les erreurs reviennent en fin de leçon.
- 🧠 **Répétition espacée** : chaque mot revient au bon moment (1, 2, 4, 7, 15 puis
  30 jours) dans la « Révision du jour ».

### Rester motivé
- ⭐ XP, 🔥 série de jours, 🎯 objectif quotidien, 🏅 classement de la famille
- Sons, combos et confettis

### Pour toute la famille
- 👨‍👩‍👧 Un profil par personne, chacun avec sa progression
- 🧒 **Mode enfant** : exercices uniquement avec images et sons, sans lecture

### Entraînement libre
- 🃏 Flashcards · 🎵 Les 4 tons · ❓ Quiz (sur les mots déjà appris)

📱 Installable sur téléphone/tablette et utilisable hors-ligne (PWA).
La progression est enregistrée dans le navigateur de chaque appareil.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
index.html              accueil : profils, tableau de bord, parcours
pages/lecon.html        une leçon (découverte + exercices)
pages/                  entraînement libre (flashcards, tons, quiz)
css/style.css           styles
js/
  accueil.js            page d'accueil et parcours
  lecon.js              moteur de leçon (exercices, corrections, bilan)
  parcours.js           découpage des thèmes en unités et leçons
  profils.js            profils, XP, série, répétition espacée
  pinyin.js             syllabes, couleurs des tons, variantes de tons
  sons.js               petits sons de jeu
data/vocabulaire/       le contenu, un fichier JSON par thème
data/tons.json          séries de mots pour l'exercice des tons
docs/idees.md           roadmap et idées
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
