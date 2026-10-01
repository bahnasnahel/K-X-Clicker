// ============================================================
//  K'X Clicker - CONFIG D'EQUILIBRAGE
//  Toutes les valeurs de jeu (prix, gains, durees, seuils) sont ici.
//  Modifie ce fichier pour ajuster le jeu, rien d'autre a toucher.
//  Conventions : EUR = euros, h = heures gagnees, s = secondes.
//  Les noms des employes sont dans data/employees.json.
// ============================================================

export const CONFIG = {
  slogan: "Reprenez le temps que vos processus vous prennent.",

  // --- Sauvegarde ---
  save: { key: "kx-clicker-save", version: 5, intervalMs: 10000 },

  // --- Boucle ---
  loop: { stepMs: 100, maxCatchUpMs: 1000 },

  // --- Gains hors ligne ---
  offline: {
    rate: 0.5,            // 50 % des abonnements (moins les salaires)
    capHours: 8,          // plafond
    minAwaySeconds: 60,   // en dessous, pas d'ecran recap
  },

  // --- Bureau : niveaux, nombre d'employes maximum, cout (EUR). Le bureau change aussi dans l'image du haut. ---
  office: {
    levels: [
      { name: "Petit bureau",   staff: 3,  cost: 0 },
      { name: "Bureau partagé", staff: 5,  cost: 300 },
      { name: "Open space",     staff: 8,  cost: 1200 },
      { name: "Plateau complet", staff: 12, cost: 3800 },
      { name: "Siège de K'X",   staff: 16, cost: 12000 },
    ],
    cityCostBonus: 0.6,         // +60 % de cout par ville
  },

  // --- Stress ---
  stress: {
    max: 100,
    decayPerSec: 1.5,      // baisse naturelle quand la file est sous sa capacite
    overflowPerSec: 2,     // par tache au-dela de la capacite
    mistake: 4,            // erreur de geste (mauvais dossier, mauvaise case)
    highThreshold: 70,     // au-dessus : les clients s'agacent un peu
    gainPenaltyStart: 30,  // a partir de ce stress, les gains baissent...
    gainPenaltyMax: 0.5,   // ...jusqu'a -50 % a 100 % de stress
  },

  // --- Types de taches ---
  // gesture : drag | tap | cells | hold | choice
  // city    : ville a partir de laquelle le type existe
  // euro    : gain d'une tache faite a la main (les heures viennent UNIQUEMENT de l'automatisation)
  // hours   : heures gagnees quand une automatisation traite la tache
  // difficultyBonus : +25 % de gains par point de difficulte au-dessus de 1
  tasks: {
    relance: { label: "Relance à envoyer",       gesture: "tap",    city: 0, euro: 3,  hours: 0.2, weight: 1.0 },
    facture: { label: "Facture à saisir",        gesture: "drag",   city: 0, euro: 4,  hours: 0.3, weight: 1.0 },
    excel:   { label: "Tableau Excel à remplir", gesture: "cells",  city: 0, euro: 6,  hours: 0.5, weight: 0.7 },
    rapport: { label: "Rapport à faire",         gesture: "hold",   city: 0, euro: 10, hours: 1.0, weight: 0.5, holdMs: 1000 },
    devis:   { label: "Devis à valider",         gesture: "choice", city: 1, euro: 14, hours: 1.5, weight: 0.6 },
    contrat: { label: "Contrat à signer",        gesture: "hold",   city: 2, euro: 22, hours: 2.0, weight: 0.6, holdMs: 1400 },
  },
  difficultyBonus: 0.4,         // +40 % de gains par point de difficulte au-dessus de 1
  // Les taches deviennent de plus en plus dures avec les heures gagnees (et les villes).
  // Une tache de difficulte D demande 1 + (D-1)/passesEvery etapes a la main,
  // et une automatisation doit "passer" autant de fois dessus (donc plus lent). Il faut aussi un niveau >= D.
  difficulty: { hoursPerStep: 120, max: 8, perCity: 1, passesEvery: 2, slowArrival: 0.3 },   // slowArrival : les taches arrivent moins vite quand elles sont plus dures (+30 % de delai par point)

  queue: {
    capacity: 8,           // au-dela, le stress monte
    hardCapMult: 2,        // la file n'accepte plus de tache a capacity x 2
    baseSpawnEverySec: 4,  // taches "maison" (sans client), delai moyen
    baseWhileBelow: 5,     // les taches "maison" n'arrivent que si la boite en contient moins que ca (la pression vient des clients)
    refillBelow: 2,        // si la boite a moins de taches que ca, la suivante arrive en 1,5 s maximum
    refillSec: 1.5,
    startTasks: ["relance", "relance"],
    overdueSec: 45,        // une tache de client en attente depuis plus longtemps le mecontente
  },

  // --- Textes des taches ---
  content: {
    folders: { clients: "Clients", fournisseurs: "Fournisseurs", banque: "Banque" },
    factures: [
      { folder: "clients",      label: "Vente : 40 baguettes livrées",      amount: "58,00" },
      { folder: "clients",      label: "Facture émise : réparation freins", amount: "240,00" },
      { folder: "clients",      label: "Honoraires dossier Durand",         amount: "900,00" },
      { folder: "fournisseurs", label: "Achat de farine, 25 sacs",          amount: "312,40" },
      { folder: "fournisseurs", label: "Pièces détachées reçues",           amount: "186,90" },
      { folder: "fournisseurs", label: "Location d'échafaudage",            amount: "420,00" },
      { folder: "banque",       label: "Frais de tenue de compte",          amount: "14,50" },
      { folder: "banque",       label: "Agios du trimestre",                amount: "37,20" },
      { folder: "banque",       label: "Commission de virement",            amount: "6,80" },
    ],
    relances: [
      { who: "Garage Dupont",      txt: "Facture n°214 impayée depuis 30 jours." },
      { who: "Boulangerie Martin", txt: "Devis envoyé la semaine dernière, sans réponse." },
      { who: "Cabinet Lefèvre",    txt: "Rappel : pièces manquantes au dossier." },
      { who: "Transports Morel",   txt: "Facture n°98 arrive à échéance." },
      { who: "Menuiserie Roy",     txt: "Confirmation de rendez-vous à obtenir." },
    ],
    excels: ["Suivi des stocks", "Planning des livraisons", "Temps passé par client", "Budget du mois"],
    rapports: ["Rapport mensuel d'activité", "Bilan des interventions", "Point hebdo direction", "Synthèse des impayés"],
    devis: ["Rénovation cuisine", "Flotte de véhicules", "Site vitrine", "Audit énergétique"],
    contrats: ["Contrat de maintenance", "Contrat cadre annuel", "Accord de confidentialité", "Avenant tarifaire"],
  },

  // --- Personnel ---
  staff: {
    nahel: { baseTime: 8, timePerLevel: 1, skillEvery: 3 },   // Nahel travaille aussi : temps et competence
  },

  // --- Publicite : pour trouver des clients et des employes ---
  ads: {
    client: {
      cost: 50, perClient: 0.2, cityBonus: 0.6,   // cout = cost x (1 + 0,2 x clients) x (1 + 0,6 x ville)
      durationSec: 14,
      firstDurationSec: 5,      // la toute premiere campagne est rapide
      offers: [2, 4],           // demandes obtenues (+1 si credibilite >= 60)
      bonusCred: 60,
      maxPending: 6,            // demandes en attente maximum
      firstFree: true,          // la toute premiere campagne est offerte
    },
    recruit: {
      cost: 130, cityBonus: 0.6,
      durationSec: 20,
      candidates: [3, 5],       // profils proposes (+1 si credibilite >= 60)
      bonusCred: 60,
      maxPending: 6,
      // credibilite minimale pour voir des profils de niveau 1, 2, 3, 4, 5
      tierCred: [0, 20, 40, 60, 80],
    },
  },

  // --- Automatisation (un niveau par type de tache) ---
  // Niveau 1 s'achete en EUR, les niveaux suivants en heures gagnees.
  // Une tache de difficulte D ne peut etre automatisee que si le niveau est >= D.
  auto: {
    maxLevel: 10,
    levelNames: ["", "Macro simple", "Script planifié", "Connecteur", "Scénario n8n", "Agent IA", "Agent IA avancé", "Agent autonome", "Orchestrateur", "Système expert", "Intelligence maison"],
    baseRate: 0.06,             // taches/s au niveau 1
    rateGrowth: 1.65,           // x par niveau
    installCost: { relance: 60, facture: 90, excel: 180, rapport: 300, devis: 520, contrat: 900 },   // EUR
    hoursBase: 5,               // cout en heures du niveau 2
    hoursGrowth: 2.0,           // x par niveau
    hoursMult: { relance: 0.8, facture: 1, excel: 1.4, rapport: 2, devis: 3, contrat: 4 },
    installSec: 6,              // duree d'installation du niveau 1 (pendant ce temps : rien ne change)
    installGrowth: 1.6,         // x par niveau
    needsYanisFrom: 5,          // niveaux 5 et + : Yanis doit etre recrute
    verifySpeed: 0.7,           // avec verification : plus lent, pas de bug
    noVerifyBonus: 1.35,        // sans verification : plus rapide, risque de bug
    bugChance: 0.12,
    crashSec: 8,
    duplicates: 2,              // taches renvoyees dans la file apres un bug
    backlogCap: 12,
    euroYield: 0.4,             // part des EUR d'une tache manuelle gagnee en automatique
  },

  // --- Clients ---
  clients: {
    startOfferInSec: 8,         // premiere demande
    offerEverySec: 35,          // delai moyen entre deux demandes
    offerRepFactor: 0.92,       // x par point de reputation (arrivent plus vite)
    maxOffers: 3,
    startSatisfaction: 60,
    payFullAbove: 50,           // sous ce seuil de satisfaction, l'abonnement baisse
    satisfied: 90,              // seuil "client satisfait" (succes)
    // variations de satisfaction
    onManualFast: 2,  fastSec: 20,
    onManualSlow: 0.5,
    onAuto: 1.5,
    onBug: -4,
    overduePerSec: -0.15,       // par tache en retard dans la file
    stressMaxPerSec: -0.6,      // stress au maximum
    stressHighPerSec: -0.1,
    serviceGain: 0.4,           // (service - 0.7) x ceci, par seconde
  },

  // PALIERS de clients (rangs) : chaque palier est un enorme saut en paiement, en temps demande et en competence.
  // Dans un meme palier, chaque client a un "profil" (spread) : certains demandent plus et rapportent plus.
  // minMoney : argent gagne dans l'agence ; minCred : credibilite minimale pour qu'ils se presentent.
  sizes: {
    artisan: { label: "Artisan",      pay: 0.3, taskEverySec: 14, time: 6,   skill: [1, 1],  minMoney: 0,     minCred: 0,  weight: 1 },
    tpe:     { label: "TPE",          pay: 1.4, taskEverySec: 8,  time: 16,  skill: [2, 3],  minMoney: 500,   minCred: 25, weight: 0.9 },
    pme:     { label: "PME",          pay: 6,   taskEverySec: 5,  time: 38,  skill: [4, 5],  minMoney: 3000,  minCred: 45, weight: 0.6 },
    eti:     { label: "ETI",          pay: 26,  taskEverySec: 3,  time: 80,  skill: [6, 7],  minMoney: 15000, minCred: 65, weight: 0.35 },
    groupe:  { label: "Grand groupe", pay: 110, taskEverySec: 2,  time: 160, skill: [8, 10], minMoney: 60000, minCred: 80, weight: 0.2 },
  },
  profileSpread: [0.65, 1.6],   // multiplicateur de profil : temps x m, paiement x m^1.4, competence +/- 1 aux extremes
  higherTierDamp: 0.6,          // chaque palier plus haut deja disponible reduit la part des clients de rang inferieur
  cityNeedBonus: { time: 0.1, skill: 0 },    // par ville : +10 % de temps demande

  sectors: {
    boulangerie: { label: "Boulangerie",        city: 0, minMoney: 0,    tasks: ["facture", "relance"], names: ["Boulangerie Martin", "Le Fournil d'Anna", "Pains & Co", "Maison Gaudin"] },
    garage:      { label: "Garage",             city: 0, minMoney: 0,    tasks: ["facture", "relance", "excel"], names: ["Garage Dupont", "Auto Service 16", "Carrosserie Moreau", "Garage des Lilas"] },
    btp:         { label: "Artisan BTP",        city: 0, minMoney: 400,  tasks: ["facture", "excel", "rapport"], names: ["Menuiserie Roy", "Maçonnerie Bernard", "Toitures Faure", "Électricité Garnier"] },
    avocat:      { label: "Cabinet d'avocat",   city: 0, minMoney: 1000, tasks: ["relance", "rapport", "excel"], names: ["Cabinet Lefèvre", "Maître Vidal", "Cabinet Roche", "Avocats Delmas"] },
    logistique:  { label: "PME logistique",     city: 0, minMoney: 2000, tasks: ["excel", "rapport", "facture"], names: ["Transports Morel", "Logi16", "Express Charente", "Fret Atlantique"] },
    immo:        { label: "Agence immobilière", city: 1, minMoney: 0,    tasks: ["devis", "relance", "rapport"], names: ["Immo Sarthe", "Maison & Cie", "Cénomans Immobilier", "Pierre Blanche"] },
    archi:       { label: "Cabinet d'architectes", city: 1, minMoney: 0, tasks: ["devis", "excel", "rapport"], names: ["Atelier Mancel", "Studio 24h", "Archi Loir", "Cabinet Lemans"] },
    saas:        { label: "Start-up SaaS",      city: 2, minMoney: 0,    tasks: ["contrat", "rapport", "excel"], names: ["Looply", "Nuagix", "Kodex", "Pixelmind"] },
    agence:      { label: "Agence de communication", city: 2, minMoney: 0, tasks: ["contrat", "devis", "relance"], names: ["Studio Rive", "Agence Volt", "Plume & Pixel", "Maison Ouest"] },
  },

  // --- Credibilite et proces ---
  credibility: {
    start: 35,
    serviceLow: 0.7,            // service moyen sous ce seuil : la credibilite baisse
    serviceHigh: 0.9,           // au-dessus : elle remonte
    lowPerSec: -0.5,            // x (seuil - service), par seconde
    highPerSec: 0.03,
    onResign: -6,
    unpaidPerSec: -0.05,        // salaires impayes (argent a zero)
    offerIntervalAt0: 1.6,      // x delai entre demandes a 0 % de credibilite
    offerIntervalAt100: 0.7,    // ... a 100 %
    noBigBelow: 40,             // sous ce seuil, plus de gros clients
  },
  lawsuit: {
    below: 25,                  // credibilite sous laquelle un client peut attaquer
    checkEverySec: 6,
    chance: 0.35,
    cooldownSec: 300,
    fineBase: 300,              // x (1 + ville)
    settleCred: 12,             // a l'amiable : credibilite recuperee
    courtWinChance: 0.45,
    courtWinCred: 8,
    courtLoseCostMult: 2,       // perdu : amende x2 et le client part
    courtLoseCred: -10,
  },

  // --- Equipe de direction ---
  // recruit : cout en EUR ; upgrade : cout du niveau n = base x growth^n
  team: {
    nahel: { name: "Nahel", role: "Fondateur, sur le terrain",
      desc: "C'est toi. Chaque niveau : +10 % de gains d'argent. Tous les 5 niveaux : un gros boost x1,5. Tu apportes aussi du temps et de la compétence pour servir les clients.",
      recruit: 0, upgrade: { base: 25, growth: 1.7 }, maxLevel: 10,
      moneyPerLevel: 0.10, bigBoostEvery: 5, bigBoost: 1.5, holdFaster: 0.05, holdMin: 0.5 },
    yanis: { name: "Yanis", role: "Fondateur tech",
      desc: "Chaque niveau : +20 % de vitesse d'automatisation. Tous les 5 niveaux : x1,5 sur les heures gagnées par l'automatisation. Nécessaire pour les automatisations de niveau 5 et plus.",
      recruit: 120, upgrade: { base: 150, growth: 1.8 }, maxLevel: 10,
      speedBonus: 0.2, hoursEvery: 5, hoursBoost: 1.5 },
    jadd: { name: "Jadd Barnas", role: "Ingénieur ouvreur de fenêtres",
      desc: "Il guette la fenêtre et l'ouvre dès que quelque chose passe. À chaque ouverture, un événement arrive. Plus il monte de niveau, plus il ouvre au bon moment (événements positifs).",
      recruit: 250, upgrade: { base: 200, growth: 1.8 }, maxLevel: 10,
      eventEverySec: [35, 70], goodBase: 0.3, goodPerLevel: 0.065, goodMax: 0.95 },
    noah: { name: "Noah", role: "Cybersécurité",
      desc: "Il défend ton système : sa défense affronte la puissance de chaque attaque et en bloque une grande partie. Il réduit aussi le nombre de taps qu'il te reste à faire quand une attaque passe. Sans lui, tu es presque sans défense.",
      recruit: 400, upgrade: { base: 350, growth: 1.8 }, maxLevel: 10,
      defenseBase: 1, defensePerLevel: 1.2, tapReducePerLevel: 0.05, tapReduceMin: 0.5 },
  },

  // --- Evenements de la fenetre de Jadd ---
  // effets : money (EUR fixes + part du revenu/s), stress, cred, tasks (taches en plus), pause (s, automatisation), offer (un client se presente), hours
  jaddEvents: {
    good: [
      { text: "Un pigeon voyageur apporte une demande : un client se présente.", effect: { offer: 1 } },
      { text: "Une brise fraîche traverse le bureau : le stress retombe.",     effect: { stress: -40 } },
      { text: "Un billet s'envoie par la fenêtre : de l'argent en plus.",       effect: { money: 40, moneyPerIncome: 30 } },
      { text: "Un passant reconnaît le logo K'X : ta crédibilité monte.",       effect: { cred: 8 } },
      { text: "Un cycliste glisse une astuce d'automatisation : des heures gagnées.", effect: { hours: 3 } },
    ],
    bad: [
      { text: "Une rafale emporte des dossiers : des tâches en plus dans la file.", effect: { tasks: 3 } },
      { text: "Un pigeon se pose sur le serveur : une automatisation en pause.",    effect: { pause: 12 } },
      { text: "Un chantier voisin fait un bruit d'enfer : le stress monte.",        effect: { stress: 25 } },
      { text: "Un courant d'air emporte des billets : de l'argent en moins.",       effect: { money: -25, moneyPerIncome: -20 } },
      { text: "Un passant filme ton bureau en désordre : ta crédibilité baisse.",   effect: { cred: -6 } },
    ],
    passers: ["oiseau", "avion", "nuage", "ballon"],
  },

  // --- Attaques (visent un type de tache automatise) ---
  attacks: {
    startAutoDone: 30,      // taches automatisees avant la premiere attaque (et Noah recrutable)
    everySec: 100,          // delai moyen ; divise par (1 + frequencyPerPower x puissance)
    frequencyPerPower: 0.12,
    powerEveryHours: 70,    // +1 de puissance d'attaque toutes les 70 heures gagnees (+1 par ville)
    powerMax: 9,
    tapsBase: 4,            // taps pour repousser une attaque de puissance 1...
    tapsPerPower: 2,        // ...+2 par point de puissance (reduits par Noah)
    windowSec: 9,           // temps pour repousser
    pauseSec: 25,           // pause de l'automatisation si l'attaque reussit
    theftPct: 0.04,         // part de l'argent volee quand une attaque reussit (x puissance, max 40 %)
  },

  // --- Prestige : ouvrir une nouvelle agence ---
  prestige: {
    cities: ["Angoulême", "Le Mans", "Paris"],
    thresholds: [650, 900, 1300],  // heures gagnees (automatisation) pour ouvrir l'agence suivante
    repPerHours: 150,             // reputation gagnee = heures / ce nombre
    repBonus: 0.08,               // +10 % de gains par point de reputation
    repLargeBoost: 0.15,          // poids des gros clients +15 % par point
    news: [
      "",
      "Le Mans ajoute le devis à valider et deux nouveaux secteurs : agences immobilières et cabinets d'architectes.",
      "Paris ajoute le contrat à signer et deux nouveaux secteurs : start-up SaaS et agences de communication.",
    ],
  },

  // --- Succes : bonus = { money } ou { mult } (gains permanents) ---
  achievements: [
    { id: "first_task",   label: "Première tâche",        desc: "Traiter une tâche à la main.",                 reward: { money: 10 } },
    { id: "tasks_25",     label: "Bon rythme",            desc: "Traiter 25 tâches.",                           reward: { money: 40 } },
    { id: "tasks_200",    label: "Machine à traiter",     desc: "Traiter 200 tâches.",                          reward: { mult: 0.02 } },
    { id: "first_client", label: "Premier client",        desc: "Signer un client.",                            reward: { money: 25 } },
    { id: "five_clients", label: "Carnet de commandes",   desc: "Avoir 5 clients en même temps.",               reward: { mult: 0.02 } },
    { id: "ten_happy",    label: "10 clients satisfaits", desc: "Amener 10 clients à une satisfaction élevée.", reward: { mult: 0.03 } },
    { id: "first_wf",     label: "Première automatisation", desc: "Installer une automatisation.",              reward: { money: 50 } },
    { id: "all_types",    label: "Tout automatique",      desc: "Automatiser 4 types de tâches à la fois.",     reward: { mult: 0.03 } },
    { id: "no_bug_5",     label: "Zéro bug pendant 5 min", desc: "5 minutes d'automatisations sans aucun bug.", reward: { mult: 0.03 } },
    { id: "first_bug",    label: "Première panne",        desc: "Subir un bug. Ça arrive aux meilleurs.",       reward: { money: 15 } },
    { id: "staff_5",      label: "Une vraie équipe",      desc: "Avoir 5 employés.",                            reward: { money: 100 } },
    { id: "first_hire",   label: "Première embauche",     desc: "Embaucher un employé.",                        reward: { money: 60 } },
    { id: "full_team",    label: "Toute la direction",    desc: "Recruter Yanis, Jadd et Noah.",                reward: { mult: 0.04 } },
    { id: "firewall",     label: "Pare-feu",              desc: "Repousser 10 attaques.",                       reward: { mult: 0.03 } },
    { id: "fresh_air",    label: "Air frais",             desc: "Jadd ouvre la fenêtre 10 fois.",               reward: { mult: 0.02 } },
    { id: "office_3",     label: "Plateau complet",       desc: "Améliorer le bureau jusqu'au plateau complet.", reward: { mult: 0.03 } },
    { id: "hours_100",    label: "100 heures gagnées",    desc: "Gagner 100 heures au total.",                  reward: { mult: 0.02 } },
    { id: "rich",         label: "Petite fortune",        desc: "Gagner 10 000 EUR au total.",                  reward: { mult: 0.03 } },
    { id: "agency_2",     label: "Nouvelle agence",       desc: "Ouvrir l'agence du Mans.",                     reward: { mult: 0.05 } },
    { id: "agency_3",     label: "Paris, enfin",          desc: "Ouvrir l'agence de Paris.",                    reward: { mult: 0.08 } },
  ],
  zeroBugSec: 300,

  // --- Phrases de Jadd (tape sur sa carte) ---
  jaddLines: [
    "Une fenêtre fermée, c'est un serveur qui souffre.",
    "Je n'ai pas peur du vent. Je suis ingénieur.",
    "Ouvrir une fenêtre, c'est du refroidissement passif. Techniquement.",
    "Quelqu'un a fermé la fenêtre ? Je le saurai.",
    "Mon plus beau workflow : ouvrir, respirer, fermer.",
    "Le cloud, c'est juste le ciel qui entre par la fenêtre.",
    "Chez K'X, même les courants d'air sont automatisés.",
  ],

  // --- Progression : le contenu apparait au fur et a mesure ---
  // Chaque deblocage met le jeu en PAUSE avec une explication (bulle avec photo), puis le jeu reprend.
  // Le rythme se fait au NOMBRE DE TACHES, pas au temps : `tasks` = palier de taches faites a la main.
  // A chaque palier, le jeu genere d'un coup toutes les taches du palier suivant sauf la derniere.
  // unlockGapTasks : minimum d'actions (taches) entre deux explications.
  // when : condition (recoit l'etat du jeu) ; who/title/text : explication ; tab : onglet qui apparait
  unlockGapTasks: 1,
  prefillWithin: 10,     // on pre-genere seulement si le palier est a moins de 10 taches
  unlocks: [
    { id: "facture",  tasks: 4,  when: (s) => s.stats.tasksDone >= 4,  who: "nahel", title: "Nouvelle tâche : la facture", text: "Des factures arrivent. Glisse chacune dans le bon dossier : Clients si c'est une vente, Fournisseurs si c'est un achat, Banque pour les frais bancaires. Une erreur te fait monter le stress." },
    { id: "stress",   tasks: 10, when: (s) => s.stats.tasksDone >= 10, who: "nahel", title: "Nouveau : le stress", text: "Si trop de tâches s'accumulent dans ta boîte, le stress monte. Plus il est haut, plus tes gains baissent, et à 100 % tes clients perdent en satisfaction. Touche le « ? » pour le détail." },
    { id: "excel",    tasks: 15, when: (s) => s.stats.tasksDone >= 15, who: "nahel", title: "Nouvelle tâche : le tableau Excel", text: "Des tableaux à remplir : tape les 3 cases qui brillent. Une mauvaise case fait monter le stress. Ça rapporte plus qu'une relance." },
    { id: "clients",  tasks: 18, when: (s) => s.stats.tasksDone >= 18 && s.stats.moneyEarned >= 50, who: "nahel", tab: "clients", title: "Nouvel onglet : Clients", text: "Pour trouver des clients, il faut faire de la publicité. Lance une campagne : après quelques secondes, des clients se présentent. La première campagne est offerte. Signe un client : il paie un abonnement tant qu'il est bien servi." },
    { id: "team",     when: (s) => s.stats.clientsSigned >= 1, who: "nahel", tab: "team", title: "Nouvel onglet : Équipe", text: "Chaque client demande du temps de travail et un niveau de compétence. Pour les servir, embauche du monde : lance une campagne de recrutement. Plus ta crédibilité est haute, plus les profils sont forts. Attention, ton bureau limite le nombre d'employés." },
    { id: "workflows", when: (s) => s.stats.moneyEarned >= 160 && s.stats.clientsSigned >= 1, who: "yanis", tab: "workflows", title: "Nouvel onglet : Workflows", text: "On peut automatiser une tâche répétitive. Installe l'automatisation d'un type de tâche : elle se met en place après un délai, puis traite ces tâches toute seule. Tu peux la monter de niveau pour aller plus vite et gérer les tâches plus difficiles." },
    { id: "difficulty", when: (s) => s.hoursRun >= CONFIG.difficulty.hoursPerStep && s.flags.workflows, who: "yanis", title: "Les tâches deviennent plus dures", text: "Plus tu avances, plus les tâches sont difficiles. À la main, une tâche difficile demande plusieurs étapes. Une automatisation doit passer plusieurs fois dessus, donc elle est plus lente, et son niveau doit être au moins égal à la difficulté, sinon elle ne la traite pas. Il faudra monter tes automatisations." },
    { id: "hours",    when: (s) => s.stats.autoDone >= 1, who: "yanis", title: "Nouveau : les heures gagnées", text: "Chaque tâche traitée automatiquement te fait gagner des heures. À la main, tu gagnes seulement de l'argent. Dépense tes heures pour monter tes automatisations. Leur total te rapproche aussi d'une nouvelle agence." },
    { id: "rapport",  tasks: 40, when: (s) => s.stats.tasksDone >= 40, who: "nahel", title: "Nouvelle tâche : le rapport", text: "Des rapports à rédiger : maintiens ton doigt appuyé jusqu'à ce que la barre soit pleine. Ça rapporte bien." },
    { id: "dir_yanis", when: (s) => s.flags.hours && s.stats.autoDone >= 6, who: "yanis", title: "Yanis peut être recruté", text: "Avec moi dans l'équipe, tu peux monter tes automatisations au niveau 5 et plus, et elles vont plus vite. Tous les 5 niveaux, je multiplie par 1,5 les heures que tu gagnes." },
    { id: "dir_jadd", when: (s) => s.flags.stress && s.stats.clientsSigned >= 2 && s.stats.moneyEarned >= 400, who: "jadd", title: "Jadd peut être recruté", text: "Je guette la fenêtre. Dès que quelque chose passe, je l'ouvre, et il se passe un truc : parfois une bonne surprise, parfois moins. Plus je monte de niveau, plus je tombe au bon moment." },
    { id: "office",   when: (s) => s.staff.length >= CONFIG.office.levels[Math.min(s.office, CONFIG.office.levels.length - 1)].staff && s.staff.length > 0, who: "nahel", title: "Ton bureau est plein", text: "Tu ne peux pas embaucher plus de monde que ton bureau n'a de places. Améliore le bureau dans l'onglet Équipe : il change aussi d'aspect en haut de l'écran." },
    { id: "dir_noah", when: (s) => s.stats.autoDone >= CONFIG.attacks.startAutoDone, who: "noah", title: "Noah peut être recruté", text: "Des cyberattaques vont viser tes automatisations, et elles vont devenir de plus en plus puissantes. Sans moi, tu es presque sans défense : une attaque qui passe met l'automatisation en pause et te vole de l'argent. Avec moi, ma défense affronte chaque attaque, et il te reste moins de taps à faire pour les repousser." },
    { id: "agency",   when: (s) => s.hoursRun >= 120, who: "nahel", tab: "agency", title: "Nouvel onglet : Agence", text: "Quand tu auras gagné assez d'heures, tu pourras ouvrir K'X dans une nouvelle ville. Tu repars de zéro, mais avec de la réputation : des gains en plus et de plus gros clients." },
    { id: "success",  when: (s) => Object.keys(s.achievements).length >= 3, tab: "success", who: "nahel", title: "Nouvel onglet : Succès", text: "Tu débloques des succès en jouant. Chacun donne un petit bonus : de l'argent ou des gains permanents." },
    { id: "devis",    when: (s) => s.city >= 1, who: "nahel", title: "Nouvelle tâche : le devis", text: "Au Mans, il y a des devis à valider. Additionne les lignes et tape le bon total." },
    { id: "contrat",  when: (s) => s.city >= 2, who: "nahel", title: "Nouvelle tâche : le contrat", text: "À Paris, des contrats à signer. Maintiens ton doigt un peu plus longtemps." },
  ],

  // --- Tutoriel de depart (le jeu est en pause pendant les explications) ---
  tutorial: [
    { who: "nahel", text: "Bienvenue chez K'X. Des tâches arrivent dans ta boîte. Traite-les à la main pour gagner de l'argent." },
    { who: "nahel", text: "Pour une relance : lis le message, puis tape « Envoyer ». Je te présenterai le reste au fur et à mesure." },
  ],

  // --- Textes d'aide des « ? » ---
  help: {
    money: ["Argent", "Tu gagnes des euros en traitant des tâches à la main, avec les abonnements de tes clients et avec tes automatisations. Tu les dépenses pour la publicité, les employés, le bureau, les automatisations et les directeurs."],
    hours: ["Heures gagnées", "Chaque tâche traitée automatiquement te fait gagner du temps : ce sont les heures gagnées. Tu n'en gagnes pas en traitant à la main. Dépense-les pour monter tes automatisations. Leur total te rapproche aussi de l'ouverture d'une nouvelle agence."],
    stress: ["Stress", "Le stress monte quand trop de tâches s'accumulent dans ta boîte (au-delà de sa capacité) et quand tu fais des erreurs. À partir de 30 %, tous tes gains baissent, jusqu'à -50 % à 100 %. À 100 %, tes clients perdent aussi en satisfaction. Il redescend quand la boîte se vide."],
    credibility: ["Crédibilité", "Si tu ne sers pas bien tes clients (pas assez de temps ou de compétence), ta crédibilité baisse. Plus elle est haute, plus les profils proposés par tes campagnes de recrutement sont forts, et plus tu reçois de clients. Trop basse, un client peut t'attaquer en justice."],
  },
};
