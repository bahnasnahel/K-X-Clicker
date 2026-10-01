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
  save: { key: "kx-clicker-save", version: 6, intervalMs: 10000 },

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
  difficulty: {
    hoursPerStep: 120,          // 1er palier de difficulte a 120 h gagnees ; chaque palier demande stepGrowth fois plus d'heures que le precedent (120, 240, 480, 960...)
    stepGrowth: 2,
    max: 8, perCity: 1, passesEvery: 2,
    slowArrival: 0.3,           // les taches arrivent moins vite quand elles sont plus dures (+30 % de delai par point)
    // difficulte reelle d'une tache a la main = difficulte moyenne + ecart : [ecart, chance]. Les extremes (+-2) sont rares.
    spread: [[-2, 0.06], [-1, 0.29], [0, 0.30], [1, 0.29], [2, 0.06]],
  },   // slowArrival : les taches arrivent moins vite quand elles sont plus dures (+30 % de delai par point)

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
  // Tous les dirigeants peuvent etre envoyes chez un client : temps = baseTime + niveau x timePerLevel,
  // competence = skillBase + 1 tous les skillEvery niveaux. Un dirigeant n'est disponible qu'une fois recrute.
  staff: {
    nahel: { baseTime: 8, timePerLevel: 1, skillBase: 1, skillEvery: 3 },
    yanis: { baseTime: 8, timePerLevel: 1, skillBase: 3, skillEvery: 3 },
    jadd:  { baseTime: 6, timePerLevel: 1, skillBase: 2, skillEvery: 3 },
    noah:  { baseTime: 6, timePerLevel: 1, skillBase: 3, skillEvery: 3 },
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
      cost: 70, cityBonus: 0.6,
      durationSec: 20,
      candidates: [3, 5],       // profils proposes (+1 si credibilite >= 60)
      bonusCred: 60,
      maxPending: 6,
      // credibilite minimale pour voir des profils de niveau 1, 2, 3, 4, 5
      tierCred: [0, 20, 40, 60, 80],
      luckyChance: 0.12,        // chance qu'un profil soit un niveau AU-DESSUS de ce que permet la credibilite
      targetedMult: 3,          // campagne ciblee : cout x3 et profils jusqu'a un niveau de plus
      namedShare: 0.35,         // part des profils tires de data/employees.json (profils "nommes") ; le reste est genere
      // profils generes, par niveau (1 a 5) : plages [min, max] ; un meme tirage place le profil dans toutes les plages
      generator: [
        { time: [3, 6],   skill: [1, 1],  hire: [10, 50],     salary: [0.01, 0.07] },
        { time: [6, 11],  skill: [2, 3],  hire: [70, 300],    salary: [0.08, 0.32] },
        { time: [9, 15],  skill: [3, 5],  hire: [250, 950],   salary: [0.25, 1.0] },
        { time: [12, 20], skill: [6, 8],  hire: [1000, 4200], salary: [1, 3.6] },
        { time: [16, 32], skill: [8, 10], hire: [5000, 26000], salary: [4, 15] },
      ],
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
    // bouche-a-oreille : une demande arrive toute seule apres offerEverySec x facteur (facteur : offerIntervalAt0 a 0 % de credibilite, offerIntervalAt100 a 100 %)
    offerEverySec: 30,
    offerIntervalAt0: 20,       // x delai a 0 % de credibilite (presque jamais : 600 s)
    offerIntervalAt100: 1,      // x delai a 100 % de credibilite (30 s)
    maxOffers: 3,               // le bouche-a-oreille s'arrete quand tant de demandes attendent
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
    terminateCred: -3,          // arreter un contrat toi-meme coute un peu de credibilite
  },

  // PALIERS de clients (rangs) : chaque palier est un enorme saut en paiement, en temps demande et en competence.
  // Dans un meme palier, chaque client a un "profil" (spread) : certains demandent plus et rapportent plus.
  // minMoney : argent gagne dans l'agence ; minCred : credibilite minimale ; minSec : score de securite minimal pour qu'ils se presentent.
  sizes: {
    artisan: { label: "Artisan",      pay: 0.3, taskEverySec: 14, timeRange: [4, 12],    skill: [1, 1],  minMoney: 0,     levelMoney: [250, 800], minCred: 0, minSec: 0,  weight: 1 },
    tpe:     { label: "TPE",          pay: 1.4, taskEverySec: 8,  timeRange: [9, 30],    skill: [2, 3],  minMoney: 500,   levelMoney: [1500, 4500], minCred: 25, minSec: 10, weight: 0.9 },
    pme:     { label: "PME",          pay: 6,   taskEverySec: 5,  timeRange: [20, 70],   skill: [4, 5],  minMoney: 3000,  levelMoney: [9000, 27000], minCred: 45, minSec: 30, weight: 0.6 },
    eti:     { label: "ETI",          pay: 26,  taskEverySec: 3,  timeRange: [45, 140],  skill: [6, 7],  minMoney: 15000, levelMoney: [50000, 140000], minCred: 65, minSec: 55, weight: 0.35 },
    groupe:  { label: "Grand groupe", pay: 110, taskEverySec: 2,  timeRange: [90, 280],  skill: [8, 10], minMoney: 60000, levelMoney: [200000, 600000], minCred: 80, minSec: 80, weight: 0.2 },
  },
  profileSpread: [0.65, 1.6],   // multiplicateur de profil : paiement x m^1.4, competence +/- 1 aux extremes. Le temps demande suit la meme position dans timeRange.
  // Niveaux dans chaque rang (Niv. 1 a 3) : levelMoney = argent gagne pour ouvrir le Niv. 2 puis le Niv. 3.
  // Chaque niveau multiplie le gain et le temps demande, et ajoute de la competence.
  rankLevels: [
    { pay: 1,   time: 1,    skill: 0 },
    { pay: 1.8, time: 1.15, skill: 0 },
    { pay: 3.2, time: 1.3,  skill: 1 },
  ],
  higherTierDamp: 0.6,          // chaque palier plus haut deja disponible reduit la part des clients de rang inferieur
  cityNeedBonus: { time: 0.1, skill: 0 },    // par ville : +10 % de temps demande

  sectors: {
    boulangerie: { label: "Boulangerie", prefix: "Boulangerie",        city: 0, minMoney: 0,    tasks: ["facture", "relance"], names: ["Boulangerie Martin", "Le Fournil d'Anna", "Pains & Co", "Maison Gaudin"] },
    garage:      { label: "Garage", prefix: "Garage",             city: 0, minMoney: 0,    tasks: ["facture", "relance", "excel"], names: ["Garage Dupont", "Auto Service 16", "Carrosserie Moreau", "Garage des Lilas"] },
    btp:         { label: "Artisan BTP", prefix: "Entreprise",        city: 0, minMoney: 400,  tasks: ["facture", "excel", "rapport"], names: ["Menuiserie Roy", "Maçonnerie Bernard", "Toitures Faure", "Électricité Garnier"] },
    avocat:      { label: "Cabinet d'avocat", prefix: "Cabinet",   city: 0, minMoney: 1000, tasks: ["relance", "rapport", "excel"], names: ["Cabinet Lefèvre", "Maître Vidal", "Cabinet Roche", "Avocats Delmas"] },
    logistique:  { label: "PME logistique", prefix: "Transports",     city: 0, minMoney: 2000, tasks: ["excel", "rapport", "facture"], names: ["Transports Morel", "Logi16", "Express Charente", "Fret Atlantique"] },
    immo:        { label: "Agence immobilière", prefix: "Immo", city: 1, minMoney: 0,    tasks: ["devis", "relance", "rapport"], names: ["Immo Sarthe", "Maison & Cie", "Cénomans Immobilier", "Pierre Blanche"] },
    archi:       { label: "Cabinet d'architectes", prefix: "Atelier", city: 1, minMoney: 0, tasks: ["devis", "excel", "rapport"], names: ["Atelier Mancel", "Studio 24h", "Archi Loir", "Cabinet Lemans"] },
    saas:        { label: "Start-up SaaS", prefix: "",      city: 2, minMoney: 0,    tasks: ["contrat", "rapport", "excel"], names: ["Looply", "Nuagix", "Kodex", "Pixelmind"] },
    agence:      { label: "Agence de communication", prefix: "Agence", city: 2, minMoney: 0, tasks: ["contrat", "devis", "relance"], names: ["Studio Rive", "Agence Volt", "Plume & Pixel", "Maison Ouest"] },
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
  },
  lawsuit: {
    below: 25,                  // credibilite sous laquelle un client peut attaquer
    checkEverySec: 6,
    chance: 0.35,
    cooldownSec: 300,
    fineBase: 300,              // x (1 + ville)
    settleCred: 12,             // a l'amiable : credibilite recuperee
    courtWinMin: 0.25,          // chance de gagner si le service rendu a ce client etait <= serviceLow
    courtWinMax: 0.75,          // ... et s'il etait >= serviceHigh (lineaire entre les deux)
    serviceLow: 0.2, serviceHigh: 0.8,
    damagesShare: 0.5,          // gagne : le client verse cette part de l'amende en dommages
    courtWinCred: 8,
    courtLoseCostMult: 2,       // perdu : amende x2 et le client part
    courtLoseCred: -10,
  },

  // --- Equipe de direction ---
  // recruit : cout en EUR ; upgrade : cout du niveau n = base x growth^n
  team: {
    nahel: { name: "Nahel", role: "Fondateur, sur le terrain",
      desc: "C'est toi. Chaque niveau : +10 % de gains d'argent. Tous les 5 niveaux : un gros boost x1,5. Tu apportes aussi du temps et de la compétence pour servir les clients.",
      recruit: 0, upgrade: { base: 25, growth: 1.45 }, maxLevel: 100,
      moneyPerLevel: 0.10, bigBoostEvery: 5, bigBoost: 1.5, holdFaster: 0.05, holdMin: 0.5 },
    yanis: { name: "Yanis", role: "Fondateur tech",
      desc: "Chaque niveau : +20 % de vitesse d'automatisation. Tous les 5 niveaux : x2 sur les heures gagnées par l'automatisation. Nécessaire pour les automatisations de niveau 5 et plus.",
      recruit: 120, upgrade: { base: 150, growth: 1.5 }, maxLevel: 100,
      speedBonus: 0.2, hoursEvery: 5, hoursBoost: 2 },
    jadd: { name: "Jadd Barnas", role: "Ingénieur ouvreur de fenêtres",
      desc: "Il guette la fenêtre et l'ouvre dès que quelque chose passe. À chaque ouverture, un événement arrive. Plus il monte de niveau, plus il ouvre au bon moment : 50 % d'événements positifs au départ, 80 % au niveau 10. Après le niveau 10, chaque niveau renforce de 10 % l'effet des bons événements. Tous les 5 niveaux, cet effet est doublé (x2 au niveau 5, x4 au niveau 10...).",
      recruit: 250, upgrade: { base: 200, growth: 1.5 }, maxLevel: 100,
      eventEverySec: [35, 70], goodBase: 0.5, goodPerLevel: 0.03, goodMax: 0.8,       // chance de bon evenement : 50 % -> 80 % au niveau 10
      goodAfter: 10, goodAfterPerLevel: 0.1, goodDoubleEvery: 5 },   // effet des bons evenements : +10 % par niveau apres le niveau 10, x2 tous les 5 niveaux
    noah: { name: "Noah", role: "Cybersécurité",
      desc: "Il traque les ennemis qui t'attaquent et les détruit. Chaque niveau : il va plus vite. Tous les 10 niveaux, il traque un ennemi de plus en même temps (2 au niveau 10, 3 au niveau 20...). Chaque ennemi détruit te rapporte de l'argent. Tu choisis qui il vise en priorité dans l'onglet Sécurité.",
      recruit: 0, upgrade: { base: 350, growth: 1.5 }, maxLevel: 100,      // offert des l'introduction de la securite
      huntBase: 1, huntPerLevel: 0.6,                                      // points de traque par seconde et par ennemi
      huntEvery: 10 },                                                      // un ennemi de plus traque en meme temps tous les 10 niveaux                                     // points de traque par seconde : base + niveau x par niveau
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

  // --- Attaques : quatre sortes, chacune avec sa contre-mesure et une decision. Elles viennent des ennemis ---
  attacks: {
    startAutoDone: 30,      // taches automatisees avant l'introduction de la securite (Noah offert, premiers ennemis)
    powerMax: 9,
    windowSec: 20,          // temps pour decider ; sans decision, c'est l'option par defaut (la pire)
    // feeMin : cout minimal x puissance ; feeSec : ou secondes de revenu des clients (le plus grand des deux)
    kinds: {
      phishing:   { label: "Phishing", weight: 4, measure: "training", fallback: "miss", mails: 4, theftPct: 0.04, pauseSec: 25,
        intro: "Un employé a reçu des mails suspects. Un seul est un piège : repère-le avant qu'on ne clique." },
      ddos:       { label: "Attaque DDoS", weight: 3, fallback: "ignore", measure: "firewall", feeMin: 40, feeSec: 20, cutPauseSec: 30, tasksBase: 4, tasksPerPower: 1, stress: 20,
        intro: "Ton serveur est submergé de requêtes. Choisis comment réagir." },
      ransomware: { label: "Ransomware", weight: 2, fallback: "rebuild", measure: "backup", feeMin: 120, feeSec: 60, restorePauseSec: 10, rebuildPauseSec: 90,
        intro: "Une automatisation vient d'être chiffrée et bloquée. Un message réclame une rançon." },
      leak:       { label: "Fuite de données", weight: 2, fallback: "hush", measure: "encrypt", feeMin: 80, feeSec: 40, warnCred: -4, hushRisk: 0.5, scandalCred: -15, scandalFineMult: 2,
        intro: "Des données de tes clients ont fuité. Que fais-tu ?" },
    },
  },

  // --- Ennemis : plus tu gagnes d'argent, plus il y en a et plus ils sont forts ---
  // chaleur = log10(1 + argent gagne dans l'agence / moneyScale). Noah les traque et les detruit un par un.
  enemies: {
    firstSpawnSec: 40,
    spawnEverySec: 120,     // delai moyen entre deux arrivees, divise par (1 + spawnPerHeat x chaleur)
    spawnPerHeat: 0.5,
    moneyScale: 200,
    capBase: 1, capPerHeat: 1, capMax: 8,        // ennemis actifs au maximum : capBase + capPerHeat x chaleur
    heatPerLevel: 1.2,      // niveau maximum d'un nouvel ennemi : 1 + chaleur / heatPerLevel (jusqu'a 5)
    levelBias: 1.5,         // > 1 : les niveaux bas sont plus frequents
    hpBase: 60,             // points de traque pour un niveau 1 ; x niveau^hpPow x style
    hpPow: 1.4,
    attackEverySec: 100,    // delai moyen entre deux attaques d'un ennemi ; / (1 + attackPerLevel x (niveau - 1)) / style
    attackPerLevel: 0.15,
    powerPerLevel: 2,       // puissance d'une attaque = (1 + powerPerLevel x (niveau - 1)) x style + ville
    favouriteChance: 0.75,  // part des attaques de sa sorte favorite
    bountyMin: 40,          // butin a la destruction : le plus grand de bountyMin x niveau et (revenu/s x bountySec x niveau)
    bountySec: 20,
    levels: ["Script kiddie", "Hacker isolé", "Groupe organisé", "Mafia du web", "Cyber-armée"],
    styles: {
      spammer:   { label: "Spammeur",     desc: "Attaque très souvent, mais des attaques faibles.",   rate: 2.5, power: 0.5, hp: 0.8 },
      sniper:    { label: "Sniper",       desc: "Attaque rarement, mais très fort.",                  rate: 0.4, power: 2,   hp: 1.2 },
      balanced:  { label: "Opportuniste", desc: "Ni lent ni rapide, ni faible ni fort.",              rate: 1,   power: 1,   hp: 1 },
      entrenched:{ label: "Retranché",    desc: "Très long à détruire : il a le temps de t'embêter.", rate: 0.9, power: 1,   hp: 2.2 },
    },
    names: ["Phantom", "Shadow", "Null", "Zero", "Ghost", "Cipher", "Void", "Rogue", "Viper", "Raven", "Glitch", "Cobra", "Spectre", "Onyx"],
  },

  // Faux mails du phishing : un piege + des mails normaux
  phishing: {
    good: [
      { from: "compta@atelier-mancel.fr", subject: "Facture de mars à régler" },
      { from: "m.durand@studio24h.fr", subject: "Compte rendu de notre réunion" },
      { from: "support@banque-ouest.fr", subject: "Votre relevé mensuel est disponible" },
      { from: "contact@looply.io", subject: "Question sur le devis n°1042" },
      { from: "rh@cabinet-lemans.fr", subject: "Planning des congés d'été" },
      { from: "livraisons@fournisseur-martin.fr", subject: "Bon de livraison joint" },
    ],
    bad: [
      { from: "securite@kx-automatisation.co", subject: "URGENT : votre compte sera suspendu sous 24 h" },
      { from: "paiement@banque-ouest-secure.com", subject: "Confirmez vos identifiants pour débloquer le virement" },
      { from: "ceo.direction@gmail.com", subject: "Virement confidentiel à faire tout de suite" },
      { from: "facture@fourni5seur-martin.fr", subject: "Facture impayée : cliquez ici pour éviter des frais" },
    ],
  },

  // --- Securite : mesures permanentes de l'agence (niveau par mesure) ---
  // Chaque niveau : +pts au score de securite (exige par les gros clients) et +blockPerLevel de chance de bloquer sa sorte d'attaque.
  // cout du niveau n = base x growth^n EUR
  security: {
    measures: [
      { id: "training", label: "Formation du personnel", kind: "phishing",   desc: "Tes équipes repèrent les faux mails.",                    max: 5, pts: 4, blockPerLevel: 0.08, cost: [120, 2.2] },
      { id: "firewall", label: "Pare-feu",               kind: "ddos",       desc: "Une partie du trafic malveillant est filtrée.",           max: 5, pts: 4, blockPerLevel: 0.08, cost: [200, 2.2] },
      { id: "backup",   label: "Sauvegardes",            kind: "ransomware", desc: "Permet de restaurer vite après un ransomware (niveau 1 minimum).", max: 5, pts: 4, blockPerLevel: 0.08, restoreFaster: 0.12, cost: [250, 2.2] },
      { id: "encrypt",  label: "Chiffrement des données", kind: "leak",      desc: "Des données volées deviennent inexploitables.",           max: 5, pts: 4, blockPerLevel: 0.08, cost: [300, 2.2] },
      { id: "audit",    label: "Audit de sécurité",      kind: null,         desc: "Un expert certifie ton niveau : points de score, sans protection directe.", max: 5, pts: 4, blockPerLevel: 0, cost: [400, 2.4] },
    ],
    blockMax: 0.7,          // plafond de la chance de blocage d'une mesure
  },

  // --- Agences : une par ville, qui tournent EN PARALLELE ---
  // L'argent est commun a toute l'entreprise. Une agence que tu ne diriges pas continue de produire
  // (abonnements moins salaires, et heures de ses automatisations), a `passiveFactor` de son rythme.
  prestige: {
    cities: ["Angoulême", "Le Mans", "Paris"],
    prices: [0, 1000000, 50000000],   // prix en EUR pour debloquer chaque agence
    freeAdsOnReset: 1,                // campagnes gratuites (clients et recrutement) offertes a chaque remise a zero
    passiveFactor: 0.6,               // rendement d'une agence que tu ne diriges pas
    // Remise a zero de l'agence ou tu es : points = (heures gagnees dans cette agence / divisor) ^ power
    pointsDivisor: 80,
    pointsPower: 1.15,
    news: [
      "",
      "Le Mans ajoute le devis à valider et deux nouveaux secteurs : agences immobilières et cabinets d'architectes.",
      "Paris ajoute le contrat à signer et deux nouveaux secteurs : start-up SaaS et agences de communication.",
    ],
  },

  // --- Boutique permanente (points gagnes en remettant une agence a zero) ---
  // unit : eur | pct | lvl | count | pts ; per : effet par niveau ; cost : niveau n coute base x growth^n points
  shop: {
    groups: ["Départs", "Réductions", "Bonus", "Déblocages"],
    items: [
      { id: "startMoney",  group: 0, label: "Capital de départ",     desc: "Argent offert au début de chaque agence.",                 unit: "eur",   per: 250, max: 20, cost: [2, 1.3] },
      { id: "startOffice", group: 0, label: "Bureau de départ",      desc: "Chaque agence démarre avec un bureau plus grand.",         unit: "lvl",   per: 1,   max: 4,  cost: [3, 2] },
      { id: "freeAds",     group: 0, label: "Publicités offertes",   desc: "Campagnes de clients et de recrutement gratuites au début de chaque agence.", unit: "count", per: 1, max: 10, cost: [2, 1.3] },
      { id: "startCred",   group: 0, label: "Crédibilité de départ", desc: "Tu démarres avec plus de crédibilité (de meilleurs profils, plus de clients).", unit: "pts", per: 4, max: 12, cost: [2, 1.3] },
      { id: "startAuto",   group: 0, label: "Automatisations de départ", desc: "Les premiers types de tâches démarrent déjà automatisés (niveau 1).", unit: "count", per: 1, max: 6, cost: [4, 1.7] },
      { id: "startDir",    group: 0, label: "Direction aguerrie",    desc: "Nahel et les directeurs démarrent à un niveau plus haut dans chaque agence.", unit: "lvl", per: 1, max: 20, cost: [3, 1.4] },
      { id: "hireDiscount",  group: 1, label: "Embauches moins chères",       desc: "Réduction sur le coût d'embauche des employés.", unit: "pct", per: 6, max: 10, cost: [2, 1.4] },
      { id: "adDiscount",    group: 1, label: "Publicités moins chères",      desc: "Réduction sur toutes les campagnes de publicité.", unit: "pct", per: 6, max: 10, cost: [2, 1.4] },
      { id: "autoDiscount",  group: 1, label: "Automatisations moins chères", desc: "Réduction sur l'installation et l'amélioration des automatisations (euros et heures).", unit: "pct", per: 6, max: 10, cost: [2, 1.4] },
      { id: "officeDiscount", group: 1, label: "Direction et bureau moins chers", desc: "Réduction sur les améliorations du bureau et des dirigeants.", unit: "pct", per: 6, max: 10, cost: [2, 1.4] },
      { id: "autoSpeed",   group: 2, label: "Automatisations plus rapides", desc: "Vitesse de toutes les automatisations.",             unit: "pct", per: 10, max: 30, cost: [3, 1.3] },
      { id: "hoursGain",   group: 2, label: "Heures gagnées",        desc: "Plus d'heures gagnées par l'automatisation.",              unit: "pct", per: 8,  max: 30, cost: [3, 1.3] },
      { id: "luck",        group: 2, label: "Chance",                desc: "Plus de profils et de clients rares, épiques et au-dessus.", unit: "pct", per: 15, max: 20, cost: [3, 1.3] },
      { id: "clientPay",   group: 2, label: "Clients plus rentables", desc: "Les abonnements des clients rapportent plus.",            unit: "pct", per: 6,  max: 30, cost: [3, 1.3] },
      { id: "taskGain",    group: 2, label: "Tâches mieux payées",   desc: "Gains d'argent des tâches faites à la main.",              unit: "pct", per: 8,  max: 30, cost: [2, 1.3] },
      { id: "loyalty",     group: 2, label: "Clients fidèles",       desc: "La satisfaction des clients baisse moins vite.",            unit: "pct", per: 8,  max: 10, cost: [3, 1.4] },
      { id: "tierCred",    group: 3, label: "Meilleurs profils plus tôt", desc: "Moins de crédibilité nécessaire pour attirer des profils d'un niveau plus haut.", unit: "pts", per: 4, max: 10, cost: [3, 1.5] },
      { id: "clientRanks", group: 3, label: "Gros clients plus tôt", desc: "Les rangs de clients s'ouvrent avec moins d'argent et de crédibilité.", unit: "pct", per: 8, max: 10, cost: [3, 1.5] },
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
    { id: "agency_2",     label: "Nouvelle agence",       desc: "Débloquer l'agence du Mans.",                     reward: { mult: 0.05 } },
    { id: "agency_3",     label: "Paris, enfin",          desc: "Débloquer l'agence de Paris.",                    reward: { mult: 0.08 } },
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
    { id: "difficulty", when: (s) => s.hoursRun >= CONFIG.difficulty.hoursPerStep && s.flags.workflows, who: "yanis", title: "Les tâches deviennent plus dures", text: "Plus tu avances, plus les tâches sont difficiles : chaque palier demande deux fois plus d'heures que le précédent. La difficulté varie d'une tâche à l'autre (jusqu'à 2 niveaux de plus ou de moins que la moyenne, rarement). À la main, une tâche difficile demande plusieurs étapes. Une automatisation doit passer plusieurs fois dessus, donc elle est plus lente, et son niveau doit être au moins égal à la difficulté, sinon elle ne la traite pas. Il faudra monter tes automatisations." },
    { id: "hours",    when: (s) => s.stats.autoDone >= 1, who: "yanis", title: "Nouveau : les heures gagnées", text: "Chaque tâche traitée automatiquement te fait gagner des heures. À la main, tu gagnes seulement de l'argent. Dépense tes heures pour monter tes automatisations. Leur total te rapproche aussi d'une nouvelle agence." },
    { id: "rapport",  tasks: 40, when: (s) => s.stats.tasksDone >= 40, who: "nahel", title: "Nouvelle tâche : le rapport", text: "Des rapports à rédiger : maintiens ton doigt appuyé jusqu'à ce que la barre soit pleine. Ça rapporte bien." },
    { id: "dir_yanis", when: (s) => s.flags.hours && s.stats.autoDone >= 6, who: "yanis", title: "Yanis peut être recruté", text: "Avec moi dans l'équipe, tu peux monter tes automatisations au niveau 5 et plus, et elles vont plus vite. Tous les 5 niveaux, je multiplie par 2 les heures que tu gagnes." },
    { id: "dir_jadd", when: (s) => s.flags.stress && s.stats.clientsSigned >= 2 && s.stats.moneyEarned >= 400, who: "jadd", title: "Jadd peut être recruté", text: "Je guette la fenêtre. Dès que quelque chose passe, je l'ouvre, et il se passe un truc : parfois une bonne surprise, parfois moins. Plus je monte de niveau, plus je tombe au bon moment." },
    { id: "office",   when: (s) => s.staff.length >= CONFIG.office.levels[Math.min(s.office, CONFIG.office.levels.length - 1)].staff && s.staff.length > 0, who: "nahel", title: "Ton bureau est plein", text: "Tu ne peux pas embaucher plus de monde que ton bureau n'a de places. Améliore le bureau dans l'onglet Équipe : il change aussi d'aspect en haut de l'écran." },
    { id: "security", when: (s) => s.stats.autoDone >= CONFIG.attacks.startAutoDone, who: "noah", tab: "security", title: "Nouvel onglet : Sécurité", text: "Plus tu gagnes d'argent, plus des ennemis voudront t'attaquer : phishing, DDoS, ransomware, fuites de données. Je suis déjà dans l'équipe : je traque ces ennemis un par un et chaque ennemi détruit te rapporte de l'argent. Tu choisis qui je vise en priorité. Les mesures de sécurité te protègent en attendant, et les gros clients exigent un score." },
    { id: "agency",   when: (s) => s.hoursRun >= 120, who: "nahel", tab: "agency", title: "Nouvel onglet : Agences", text: "Tu peux remettre ton agence à zéro pour gagner des points, à dépenser dans une boutique de bonus permanents. Tu peux aussi débloquer d'autres agences, très chères, qui tournent en parallèle de la tienne." },
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
  // --- Bonus dore : un objet brillant passe derriere la fenetre du bureau, il faut la taper ---
  golden: {
    everySec: [120, 300],       // delai entre deux passages
    lifeSec: 8,                 // temps pour le taper
    jaddBonusEvery: 5,          // si Jadd est recrute : +1 s tous les 5 niveaux de Jadd
    kinds: ["pigeon", "drone", "avion"],
    // mult/durSec : bonus qui dure ; incomeSec : argent = ce nombre de secondes de revenus (au moins minEuro) ; w : poids du tirage
    bonuses: [
      { id: "gain",  label: "Gains x5",             mult: 5, durSec: 30, w: 1 },
      { id: "money", label: "Argent",               incomeSec: 600, minEuro: 100, w: 1 },
      { id: "auto",  label: "Automatisations x3",   mult: 3, durSec: 60, w: 1 },
      { id: "calm",  label: "Stress à zéro",        w: 1 },
    ],
  },

  // --- Rarete (employes recrutes ET clients) ---
  // chance : % de tirage ; mult : bonus. Employes : temps et competence x mult (arrondis a 0,5, competence max 10) ;
  // clients : l'abonnement x mult. Les profils de data/employees.json peuvent avoir "rarity": "legendaire" (ids ci-dessous).
  rarity: {
    list: [
      { id: "commun",      label: "Commun",      chance: 60,  mult: 1,   color: "#b9a3ee" },
      { id: "peu_commun",  label: "Peu commun",  chance: 25,  mult: 1.2, color: "#5cf0a0" },
      { id: "rare",        label: "Rare",        chance: 10,  mult: 1.5, color: "#4fa8ff" },
      { id: "epique",      label: "Épique",      chance: 3,   mult: 2,   color: "#D36BFF" },
      { id: "legendaire",  label: "Légendaire",  chance: 1.5, mult: 5,   color: "#FFD479" },
      { id: "mythique",    label: "Mythique",    chance: 0.4, mult: 10,  color: "#ff9f43" },
      { id: "supreme",     label: "Suprême",     chance: 0.1, mult: 50,  color: "#ff5d7a" },
    ],
    ticketMin: "rare",          // un ticket de recrutement garantit au moins cette rarete
    // Chance : le poids de chaque rarete est multiplie par (1 + chance)^rang (commun = rang 0). Sources : boutique (item "luck"), campagne ciblee.
    targetedLuck: 0.5,          // bonus de chance d'une campagne de recrutement ciblee
  },

  // --- Missions : 3 a la fois, objectifs et recompenses calcules sur ta progression ---
  missions: {
    count: 3,
    swapCooldownSec: 600,       // changer une mission : gratuit une fois toutes les 10 min
    earnSec: 300,               // "gagner X EUR" = environ 5 min de revenus
    rewardSec: 180,             // recompense = environ 3 min de revenus (ou d'heures)
    minRate: 0.5,               // revenu/s minimum pris en compte (debut de partie)
    minReward: 20,
    ticketChance: 0.12,         // part des recompenses qui sont un ticket de recrutement
    hoursChance: 0.3,           // part des recompenses en heures (si tu en gagnes)
    signGoal: [1, 3],           // nombre de clients a signer
    autoSec: 120,               // "automatiser N taches" = environ 2 min de cette automatisation
    autoMin: 5, autoMax: 150,
    attackGoal: [2, 5],         // attaques a repousser
  },

  // --- Serie de jours : jours d'affilee ou tu ouvres le jeu (date locale) ---
  streak: {
    capDays: 7,                 // plafond de la serie pour les recompenses
    rewardMin: 20,              // argent offert = max(rewardMin, rewardSec x revenu/s) x jours de serie
    rewardSec: 60,
    gainPerDay: 0.05,           // +5 % de gains par jour de serie, pour la journee
    gainMax: 0.35,
  },

  // --- Remerciements des clients contents ---
  thanks: {
    everySec: [90, 180],        // delai entre deux remerciements
    minSat: 90,                 // satisfaction minimale du client
    bonusSec: 60,               // prime = ce nombre de secondes de ce que rapporte ce client
    minBonus: 5,
    lifeSec: 10,                // la bulle disparait apres
  },

  help: {
    money: ["Argent", "Tu gagnes des euros en traitant des tâches à la main, avec les abonnements de tes clients et avec tes automatisations. Tu les dépenses pour la publicité, les employés, le bureau, les automatisations et les directeurs."],
    hours: ["Heures gagnées", "Chaque tâche traitée automatiquement te fait gagner du temps : ce sont les heures gagnées. Tu n'en gagnes pas en traitant à la main. Dépense-les pour monter tes automatisations. Leur total te rapproche aussi de l'ouverture d'une nouvelle agence."],
    stress: ["Stress", "Le stress monte quand trop de tâches s'accumulent dans ta boîte (au-delà de sa capacité) et quand tu fais des erreurs. À partir de 30 %, tous tes gains baissent, jusqu'à -50 % à 100 %. À 100 %, tes clients perdent aussi en satisfaction. Il redescend quand la boîte se vide."],
    satisfaction: ["Satisfaction des clients", "Chaque client a une satisfaction de 0 à 100 %. À 0 %, il résilie son abonnement et ta crédibilité baisse. Elle monte quand le service est bon (temps et compétence couverts à plus de 70 %) et baisse quand le service est insuffisant. Elle baisse aussi quand ses tâches attendent trop longtemps dans ta boîte (plus de 45 s), quand le stress dépasse 70 % (davantage à 100 %), et quand une automatisation bug. Elle monte un peu à chaque tâche traitée, plus si c'est rapide. Sous 50 %, il paie moins. Sur chaque carte client, la ligne « Évolution » te montre ce qui la fait bouger en ce moment."],
    credibility: ["Crédibilité", "Si tu ne sers pas bien tes clients (pas assez de temps ou de compétence), ta crédibilité baisse. Plus elle est haute, plus les profils proposés par tes campagnes de recrutement sont forts, et plus tu reçois de clients. Même sans publicité, des clients viennent te voir grâce au bouche-à-oreille : environ toutes les 30 s à 100 %, presque jamais à 0 %. Trop basse, un client peut t'attaquer en justice."],
  },
};
