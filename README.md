# 学中文 · Mandarin en famille

Petite application web pour apprendre le chinois mandarin en famille : flashcards
avec caractères, pinyin, traduction et prononciation audio, avec une progression
séparée pour chaque membre de la famille.

## Fonctionnalités

- 👨‍👩‍👧 **Profils** : chacun a sa propre progression (enregistrée dans le navigateur)
- 🃏 **Flashcards** par thème (salutations, animaux, couleurs, nombres, famille, nourriture, corps) : touche la carte pour la retourner
- 🎵 **Les 4 tons** : écoute une syllabe et retrouve son ton (séries dans `data/tons.json`)
- ❓ **Quiz** : 10 questions à 4 choix, du chinois vers le français et inversement
- 🔊 **Prononciation** via la synthèse vocale du navigateur (voix chinoise `zh-CN`)
- 📱 **Installable** sur téléphone/tablette et utilisable hors-ligne (PWA)

## Lancer en local

Les données sont chargées en JSON, il faut donc un petit serveur (ouvrir
`index.html` directement ne marche pas) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
index.html            accueil + choix du profil
pages/                une page par activité (flashcards, tons, quiz)
css/style.css         styles communs
js/                   logique (profils, flashcards…)
data/vocabulaire/     le contenu, un fichier JSON par thème
assets/               audio, images, icônes
docs/idees.md         roadmap et idées
```

## Ajouter du vocabulaire

1. Créer ou compléter un fichier dans `data/vocabulaire/` :

   ```json
   { "id": "mao", "hanzi": "猫", "pinyin": "māo", "fr": "chat", "emoji": "🐱" }
   ```

2. Si c'est un nouveau thème, l'ajouter dans `data/vocabulaire/index.json`.

## Déploiement

Le site est publié automatiquement sur GitHub Pages à chaque push sur `main`
(workflow `.github/workflows/deploy.yml`).
Réglage à faire une seule fois : **Settings → Pages → Source : GitHub Actions**.
