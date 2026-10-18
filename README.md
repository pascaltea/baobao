# 学中文 · Mandarin en famille

Application web pour apprendre le chinois mandarin en famille, inspirée de
Duolingo, sans publicité, sans abonnement et sans « vies » perdues.

👉 **https://pascaltea.github.io/mandarin-famille/**

## Pour qui ?

| Profil | Ce qu'il propose |
|---|---|
| 🧑 **Adulte** | Parcours de leçons, phrases du quotidien à dire aux enfants, comptines, révisions |
| 🧒 **Enfant 3-6 ans** | Leçons courtes avec images et sons (sans lecture), imagier, comptines, autocollants |
| 👶 **Bébé 0-2 ans** | Pas d'exercices : imagier à regarder avec un parent (5 min max), comptines. C'est le parent qui parle ! |

## Fonctionnalités

### Avec mes enfants
- 💬 **Au quotidien** : 51 phrases pour 8 moments de la journée (réveil, repas, habillage,
  dehors, jeu, bain, coucher, émotions), avec des conseils pour les parents, l'audio,
  « Je répète » au micro et « Je l'ai dite ! » (+2 XP quand on l'utilise pour de vrai)
- 🌅 **Phrase du jour** à dire aux enfants
- 🎶 **Comptines** traditionnelles (两只老虎, 小星星, 上山打老虎, 生日快乐) avec pinyin,
  traduction et l'air à chanter
- 🖼️ **Imagier** plein écran à regarder ensemble, avec une pause sans écran après 5 minutes

### Apprendre (adultes)
- 🗺️ **Parcours** : 7 unités, des leçons qui se débloquent, une révision 🏆 par unité
- 📖 **Notes « À savoir »** de grammaire en tête de chaque unité
- ✨ **Découverte** de chaque mot : pinyin coloré par ton, audio normal et 🐢 lent,
  astuce mnémotechnique, 🎙️ enregistrement de sa voix pour comparer
- 🧩 **Exercices** : écoute → image, écoute → sens, caractère → sens, image → caractère,
  bon pinyin (tons), paires, et **remettre la phrase dans l'ordre**
- 🧠 **Répétition espacée** et révision du jour

### Rester motivé, sans pression
- ⭐ XP, 🔥 série (un jour de repos ne la casse pas), 🎯 objectif réglable
- 🤝 **Équipe famille** : un objectif commun de la semaine plutôt qu'un classement
- Pas de vies, pas de pub, pas d'abonnement, utilisable hors-ligne

Voir [docs/critiques.md](docs/critiques.md) : les critiques faites à Duolingo et aux
autres applis, et comment l'appli y répond.

📱 Installable sur téléphone/tablette (PWA). La progression est enregistrée dans le
navigateur de chaque appareil.

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
data/vocabulaire/       le contenu, un fichier JSON par thème
data/tons.json          séries de mots pour l'exercice des tons
data/quotidien.json     routines et phrases du quotidien
data/comptines.json     paroles des comptines
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
