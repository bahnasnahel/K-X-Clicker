# K'X Clicker

Clicker de gestion sur le thème de K'X Automatisation. PWA en HTML/CSS/JS vanilla, sans build.
*Reprenez le temps que vos processus vous prennent.*

## Tester en local
```
npx http-server -c-1 .
```
Puis ouvre http://localhost:8080 (le service worker exige http(s), pas `file://`).

## Mettre en ligne (GitHub Pages)
Réglages du dépôt > Pages > Source : "Deploy from a branch", branche du jeu, dossier `/ (root)`.
L'adresse sera `https://<compte>.github.io/K-X-Clicker/`.
Sur téléphone : ouvre le lien, puis menu du navigateur > "Ajouter à l'écran d'accueil".

**À chaque mise en ligne**, incrémente `VERSION` dans `sw.js`, sinon les téléphones gardent l'ancienne version en cache.

## Équilibrage
Toutes les valeurs (prix, gains, durées, seuils) sont dans `js/config.js`.

## Structure
- `js/state.js` état + sauvegarde, `js/loop.js` boucle, `js/render.js` bureau pixel,
  `js/ui.js` interface, `js/audio.js` sons, `js/tabs/*` un fichier par onglet.
