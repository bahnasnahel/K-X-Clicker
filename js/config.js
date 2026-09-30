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
  save: { key: "kx-clicker-save", version: 3, intervalMs: 10000 },

  // --- Boucle ---
  loop: { stepMs: 100, maxCatchUpMs: 1000 },

  // --- Gains hors ligne ---
  offline: {
    rate: 0.5,            // 50 % des abonnements (moins les salaires)
    capHours: 8,          // plafond
    minAwaySeconds: 60,   // en dessous, pas d'ecran recap
  },

  // --- Bureau pixel : evolue avec le nombre d'employes ---
  desk: [
    { minStaff: 0, label: "Un PC pour commencer" },
    { minStaff: 2, label: "Deux écrans" },
    { minStaff: 5, label: "Trois écrans" },
    { minStaff: 9, label: "Le bureau tourne à plein régime" },
  ],

  // --- Stress ---
  stress: {
    max: 100,
    decayPerSec: 1.5,      // baisse naturelle quand la file est sous sa capacite
    overflowPerSec: 2,     // par tache au-dela de la capacite
    mistake: 4,            // erreur de geste (mauvais dossier, mauvaise case)
    highThreshold: 70,     // au-dessus : les clients s'agacent un peu
  },

  // --- Chaleur du bureau ---
  heat: {
    max: 100,
    perWorkflow: 5,        // chaleur cible par type de tache automatise
    perServer: 10,         // chaleur cible par serveur
    jaddPassivePerLevel: 4,// baisse de la cible par niveau de Jadd
    approachPerSec: 0.08,  // vitesse a laquelle la chaleur rejoint sa cible
    slowStart: 40,         // au-dela, les automatisations ralentissent
    slowMax: 0.5,          // ralentissement maximal a 100 % de chaleur
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
  difficultyBonus: 0.25,

  queue: {
    capacity: 8,           // au-dela, le stress monte
    hardCapMult: 2,        // la file n'accepte plus de tache a capacity x 2
    baseSpawnEverySec: 6,  // taches "maison" (sans client), delai moyen
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
    maxStaff: [5, 9, 14],       // employes maximum par ville (hors directeurs)
    nahel: { baseTime: 8, timePerLevel: 1, skillEvery: 3 },   // Nahel travaille aussi : temps et competence
  },

  // --- Automatisation (un niveau par type de tache) ---
  // Niveau 1 s'achete en EUR, les niveaux suivants en heures gagnees.
  // Une tache de difficulte D ne peut etre automatisee que si le niveau est >= D.
  auto: {
    maxLevel: 8,
    levelNames: ["", "Macro simple", "Script planifié", "Connecteur", "Scénario n8n", "Agent IA", "Agent IA avancé", "Agent autonome", "Système expert"],
    baseRate: 0.06,             // taches/s au niveau 1
    rateGrowth: 1.65,           // x par niveau
    installCost: { relance: 40, facture: 60, excel: 120, rapport: 200, devis: 350, contrat: 600 },   // EUR
    hoursBase: 5,               // cout en heures du niveau 2
    hoursGrowth: 2.2,           // x par niveau
    hoursMult: { relance: 0.8, facture: 1, excel: 1.4, rapport: 2, devis: 3, contrat: 4 },
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

  // taille des clients : plus gros = paye plus, envoie plus de taches, demande plus de temps et de competence
  sizes: {
    petit: { label: "Petit", pay: 0.15, taskEverySec: 14, time: 6,  skill: [1, 1], minMoney: 0 },
    moyen: { label: "Moyen", pay: 0.45, taskEverySec: 9,  time: 12, skill: [2, 3], minMoney: 300 },
    gros:  { label: "Gros",  pay: 1.2,  taskEverySec: 5,  time: 22, skill: [4, 5], minMoney: 1500 },
  },
  cityNeedBonus: { time: 0.1, skill: 1 },    // par ville : +10 % de temps, +1 niveau demande

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
    start: 60,
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
      desc: "C'est toi. Chaque niveau : +15 % de gains à la main, gestes plus rapides, et un peu plus de temps et de compétence pour servir les clients.",
      recruit: 0, upgrade: { base: 25, growth: 1.7 }, maxLevel: 10,
      manualBonus: 0.15, holdFaster: 0.07, holdMin: 0.5 },
    yanis: { name: "Yanis", role: "Fondateur tech",
      desc: "Nécessaire pour les automatisations de niveau 5 et plus. Chaque niveau : +20 % de vitesse d'automatisation.",
      recruit: 120, upgrade: { base: 150, growth: 1.8 }, maxLevel: 8, speedBonus: 0.2 },
    jadd: { name: "Jadd Barnas", role: "Ingénieur ouvreur de fenêtres",
      desc: "Ouvre régulièrement les fenêtres : la chaleur et le stress baissent. Chaque niveau : fenêtres plus fréquentes.",
      recruit: 250, upgrade: { base: 200, growth: 1.8 }, maxLevel: 8,
      everySec: 40, everyFactor: 0.9, heatDrop: 18, stressDrop: 10 },
    noah: { name: "Noah", role: "Cybersécurité",
      desc: "Bloque automatiquement une partie des attaques. Chaque niveau : +10 % de blocage.",
      recruit: 400, upgrade: { base: 350, growth: 1.8 }, maxLevel: 8,
      blockBase: 0.3, blockPerLevel: 0.1, blockMax: 0.9 },
  },

  servers: { max: 3, cost: 180, growth: 2.2, speedBonus: 0.18 },

  // --- Attaques (visent un type de tache automatise) ---
  attacks: {
    startAutoDone: 30,      // taches automatisees avant la premiere attaque
    everySec: 110,
    tapsToRepel: 4,
    windowSec: 9,           // temps pour repousser
    pauseSec: 25,           // pause de l'automatisation si l'attaque reussit
  },

  // --- Prestige : ouvrir une nouvelle agence ---
  prestige: {
    cities: ["Angoulême", "Le Mans", "Paris"],
    thresholds: [400, 850, 1600],  // heures gagnees (automatisation) pour ouvrir l'agence suivante
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
    { id: "servers_3",    label: "Salle des serveurs",    desc: "Posséder 3 serveurs.",                         reward: { mult: 0.03 } },
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
  // when : condition (recoit l'etat du jeu) ; who/text : bulle avec photo ; tab : onglet qui apparait
  unlocks: [
    { id: "facture",  when: (s) => s.stats.tasksDone >= 3,  who: "nahel", msg: "Nouveau type de tâche : facture", text: "Des factures arrivent. Glisse chacune dans le bon dossier : Clients, Fournisseurs ou Banque." },
    { id: "clients",  when: (s) => s.stats.tasksDone >= 6,  who: "nahel", tab: "clients", msg: "Nouvel onglet : Clients", text: "Des entreprises veulent travailler avec nous. Signe un client : il paie un abonnement, mais il faut le servir." },
    { id: "team",     when: (s) => s.stats.clientsSigned >= 1, who: "nahel", tab: "team", msg: "Nouvel onglet : Équipe", text: "Chaque client demande du temps et de la compétence. Embauche du monde pour les servir, ou occupe-toi d'eux toi-même." },
    { id: "stress",   when: (s) => s.stats.tasksDone >= 12, who: "nahel", msg: "Nouveau : le stress", text: "Si trop de tâches s'accumulent, le stress monte. Touche le « ? » pour comprendre." },
    { id: "excel",    when: (s) => s.stats.tasksDone >= 22, who: "nahel", msg: "Nouveau type de tâche : tableau Excel", text: "Des tableaux à remplir. Tape les 3 cases qui brillent." },
    { id: "workflows", when: (s) => s.stats.moneyEarned >= 120 && s.stats.clientsSigned >= 1, who: "yanis", tab: "workflows", msg: "Nouvel onglet : Workflows", text: "On peut automatiser les tâches répétitives. Installe une première automatisation : elle te fera gagner des heures." },
    { id: "hours",    when: (s) => Object.values(s.auto).some((a) => a.level > 0), who: "yanis", msg: "Nouveau : les heures gagnées", text: "Les heures gagnées viennent des tâches automatisées. Dépense-les pour améliorer tes automatisations." },
    { id: "heat",     when: (s) => s.stats.autoDone >= 8,   who: "jadd",  msg: "Nouveau : la chaleur", text: "Les machines chauffent le bureau. Touche le « ? » pour comprendre. Recrute-moi, j'ouvre les fenêtres." },
    { id: "rapport",  when: (s) => s.stats.tasksDone >= 45, who: "nahel", msg: "Nouveau type de tâche : rapport", text: "Des rapports à rédiger. Maintiens ton doigt appuyé." },
    { id: "dir_yanis", when: (s) => s.flags.workflows && s.runMoney >= 200, who: "yanis", msg: "Yanis peut être recruté", text: "Avec moi dans l'équipe, tu peux monter tes automatisations plus haut et plus vite." },
    { id: "dir_jadd", when: (s) => s.flags.heat, who: "jadd", msg: "Jadd peut être recruté", text: "Une fenêtre ouverte, c'est 20 % de chaleur en moins. Je dis ça, je dis rien." },
    { id: "dir_noah", when: (s) => s.stats.autoDone >= 30, who: "noah", msg: "Noah peut être recruté", text: "Des attaques vont viser tes automatisations. Je peux en bloquer une partie." },
    { id: "agency",   when: (s) => s.hoursRun >= 120, who: "nahel", tab: "agency", msg: "Nouvel onglet : Agence", text: "Quand tu auras gagné assez d'heures, tu pourras ouvrir K'X dans une nouvelle ville." },
    { id: "success",  when: (s) => Object.keys(s.achievements).length >= 3, tab: "success", msg: "Nouvel onglet : Succès" },
    { id: "devis",    when: (s) => s.city >= 1, who: "nahel", msg: "Nouveau type de tâche : devis", text: "Au Mans, il y a des devis à valider. Additionne les lignes et tape le bon total." },
    { id: "contrat",  when: (s) => s.city >= 2, who: "nahel", msg: "Nouveau type de tâche : contrat", text: "À Paris, des contrats à signer. Maintiens le doigt un peu plus longtemps." },
  ],

  // --- Tutoriel de depart (2 bulles) ---
  tutorial: [
    { who: "nahel", text: "Bienvenue chez K'X. Des tâches arrivent : traite-les à la main pour gagner des euros." },
    { who: "nahel", text: "Relance : lis le message, puis tape « Envoyer ». Le reste se débloquera au fur et à mesure." },
  ],

  // --- Textes d'aide des « ? » ---
  help: {
    money: ["Argent", "Tu gagnes des euros en traitant des tâches à la main, avec les abonnements de tes clients et avec tes automatisations. Tu les dépenses pour embaucher, installer des automatisations et recruter."],
    hours: ["Heures gagnées", "Chaque tâche traitée automatiquement te fait gagner du temps : ce sont les heures gagnées. Tu n'en gagnes pas en traitant à la main. Dépense-les pour améliorer tes automatisations. Leur total te rapproche aussi de l'ouverture d'une nouvelle agence."],
    stress: ["Stress", "Le stress monte quand trop de tâches s'accumulent dans ta boîte (au-delà de sa capacité) et quand tu fais des erreurs. À 100 %, tes clients perdent en satisfaction. Il redescend quand la boîte se vide. Jadd aide à le faire baisser."],
    heat: ["Chaleur", "Les automatisations et les serveurs chauffent le bureau. Au-delà de 40 %, tes automatisations ralentissent. Jadd ouvre les fenêtres pour faire baisser la chaleur."],
    credibility: ["Crédibilité", "Si tu ne sers pas bien tes clients (pas assez de temps ou de compétence), ta crédibilité baisse. Plus elle est basse, moins de clients se présentent. Trop bas, un client peut t'attaquer en justice. Bien servir tes clients la fait remonter."],
  },
};
