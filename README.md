# K'X Clicker

Clicker de gestion sur le thème de K'X Automatisation. PWA en HTML/CSS/JS vanilla, sans build, en français.
*Reprenez le temps que vos processus vous prennent.*

## Tester en local
```
npx http-server -c-1 .
```
Puis ouvre http://localhost:8080 (le service worker exige http(s), pas `file://`).

## Mettre en ligne (GitHub Pages)
Réglages du dépôt > Pages > « Deploy from a branch », branche du jeu, dossier `/ (root)`.
Sur téléphone : ouvre le lien, puis menu du navigateur > « Ajouter à l'écran d'accueil ».

**À chaque mise en ligne**, incrémente `VERSION` dans `sw.js`, sinon les téléphones gardent l'ancienne version en cache.
Si tu ajoutes un fichier, ajoute-le aussi à la liste `FILES` de `sw.js`.

## Équilibrage
**Toutes** les valeurs (prix, gains, durées, seuils, textes des tâches, succès, tutoriel) sont dans `js/config.js`.
Repères : seuil d'ouverture d'une agence dans `prestige.thresholds` (heures gagnées), cadence des clients dans `clients` et `sizes`,
vitesse des workflows dans `workflow` et `blocks`, coûts de l'équipe dans `team`.

## Mode test
Ajoute `?debug` à l'adresse : `window.kx` donne accès à `state`, `CONFIG` et `runSystems(dt)` dans la console
(ex. `kx.state.money = 5000`, `kx.state.hoursRun = 200`, ou `for (let i=0;i<600;i++) kx.runSystems(0.1)` pour avancer de 60 s).

## Structure
- `js/config.js` équilibrage et textes, `js/state.js` état + sauvegarde + gains, `js/loop.js` boucle à pas fixe
- `js/tasks.js` file de tâches, `js/taskdata.js` création des tâches, `js/tabs/tasks.js` les 5 gestes
- `js/workflows.js` blocs, cadence, bugs, automatisation, `js/tabs/workflows.js` éditeur
- `js/clients.js` demandes, abonnements, satisfaction, `js/offline.js` gains hors ligne
- `js/crew.js` équipe, chaleur, fenêtres de Jadd, attaques, `js/prestige.js` agences, `js/achievements.js` succès
- `js/render.js` bureau pixel (canvas), `js/ui.js` interface, `js/bubbles.js` + `js/tutorial.js` bulles avec photos, `js/audio.js` sons
- `js/events.js` bus d'événements entre modules (ajouter une ville ou un événement ne demande pas de toucher aux autres)
