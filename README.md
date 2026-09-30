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

## Ajouter un employé
Ouvre `data/employees.json`, copie une ligne et change l'`id` (unique), le `prenom`, le `nom`, le `titre` et les valeurs
(`time` = heures de travail apportées, `skill` = niveau de compétence 1 à 10, `hire` = coût d'embauche, `salary` = salaire en EUR/s,
`minRunMoney` et `minCity` = quand il est proposé). L'identité des 4 directeurs est dans `data/directors.json`.
Ajoute aussi le fichier à la liste `FILES` de `sw.js` si tu crées un nouveau fichier de données.

## Ajouter des photos
Dépose un `.webp` carré (256x256, recadré sur le visage) dans `assets/photos/people/`, ajoute son nom dans `data/photos.json` et dans `sw.js`.
Les photos sont distribuées au hasard aux clients et aux employés, sans doublon. S'il n'y en a plus de libre, la personne n'a pas de photo.

## Équilibrage
**Toutes** les valeurs (prix, gains, durées, seuils, textes des tâches, succès, tutoriel) sont dans `js/config.js`.
Repères : seuil d'ouverture d'une agence dans `prestige.thresholds` (heures gagnées), cadence des clients dans `clients` et `sizes`,
vitesse des workflows dans `workflow` et `blocks`, coûts de l'équipe dans `team`.

## Mode triche
Réglages (engrenage) > « Mode triche (tests) » : vitesse du jeu x1 à x50, multiplicateur de gains x1 à x100, raccourcis (+1 000 EUR, +100 h, agence suivante prête, équipe recrutée, stress à zéro, attaque). Une pastille rouge « TRICHE » s'affiche en haut à gauche du bureau tant qu'un réglage est actif (tape-la pour rouvrir le panneau). Les réglages sont sauvegardés : remets x1 pour jouer normalement.

## Mode test (console)
Ajoute `?debug` à l'adresse : `window.kx` donne accès à `state`, `CONFIG` et `runSystems(dt)` dans la console
(ex. `kx.state.money = 5000`, `kx.state.hoursRun = 200`, `kx.state.credibility = 10`, ou `for (let i=0;i<600;i++) kx.runSystems(0.1)` pour avancer de 60 s).

## Structure
- `js/config.js` équilibrage et textes, `js/state.js` état + sauvegarde + gains, `js/loop.js` boucle à pas fixe
- `js/tasks.js` file de tâches, `js/taskdata.js` création des tâches (avec difficulté), `js/tabs/tasks.js` les 5 gestes
- `js/workflows.js` automatisation par niveaux, bugs, `js/tabs/workflows.js` l'onglet Workflows
- `js/clients.js` demandes, abonnements, service, crédibilité, `js/lawsuit.js` procès, `js/offline.js` gains hors ligne
- `js/staff.js` employés, bureau, temps et compétence, affectation, salaires, `js/ads.js` publicité (clients et recrutement), `js/avatar.js` photos sans doublon, `js/data.js` chargement de `data/`
- `js/unlocks.js` progression : onglets et contenus qui apparaissent au fur et à mesure, avec explication (jeu en pause) ; `js/tutorial.js` les bulles d'explication
- `js/crew.js` directeurs, Jadd (événements de la fenêtre), attaques, `js/prestige.js` agences, `js/achievements.js` succès
- `js/render.js` bureau pixel (canvas), `js/ui.js` interface, `js/bubbles.js` + `js/tutorial.js` bulles avec photos, `js/audio.js` sons
- `js/events.js` bus d'événements entre modules (ajouter une ville ou un événement ne demande pas de toucher aux autres)
