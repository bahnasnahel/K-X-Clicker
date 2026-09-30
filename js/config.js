// ============================================================
//  K'X Clicker - CONFIG D'EQUILIBRAGE
//  Toutes les valeurs de jeu (prix, gains, durees, seuils) sont ici.
//  Modifie ce fichier pour ajuster le jeu, rien d'autre a toucher.
//  Conventions : EUR = euros, h = heures gagnees, s = secondes.
// ============================================================

export const CONFIG = {
  slogan: "Reprenez le temps que vos processus vous prennent.",

  // --- Sauvegarde ---
  save: { key: "kx-clicker-save", version: 2, intervalMs: 10000 },

  // --- Boucle ---
  loop: { stepMs: 100, maxCatchUpMs: 1000 },

  // --- Gains hors ligne ---
  offline: {
    rate: 0.5,            // 50 % des abonnements
    capHours: 8,          // plafond
    minAwaySeconds: 60,   // en dessous, pas d'ecran recap
  },

  // --- Bureau pixel : nombre d'ecrans selon les heures gagnees dans l'agence ---
  desk: [
    { minHours: 0,  label: "Un PC pour commencer" },
    { minHours: 12, label: "Deux écrans" },
    { minHours: 40, label: "Trois écrans" },
    { minHours: 100, label: "Le bureau tourne à plein régime" },
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
    perWorkflow: 5,        // chaleur cible par workflow actif
    perServer: 10,         // chaleur cible par serveur
    jaddPassivePerLevel: 4,// baisse de la cible par niveau de Jadd
    approachPerSec: 0.08,  // vitesse a laquelle la chaleur rejoint sa cible
    slowStart: 40,         // au-dela, les workflows ralentissent
    slowMax: 0.5,          // ralentissement maximal a 100 % de chaleur
  },

  // --- Types de taches ---
  // gesture : drag | tap | cells | hold | choice
  // city    : indice de la ville a partir de laquelle le type existe
  // unlockHours : heures gagnees (dans l'agence) necessaires pour qu'il apparaisse
  tasks: {
    facture: { label: "Facture à saisir",        gesture: "drag",   city: 0, unlockHours: 0,  euro: 4,  hours: 0.05, weight: 1.0 },
    relance: { label: "Relance à envoyer",       gesture: "tap",    city: 0, unlockHours: 0,  euro: 3,  hours: 0.03, weight: 1.0 },
    excel:   { label: "Tableau Excel à remplir", gesture: "cells",  city: 0, unlockHours: 1,  euro: 6,  hours: 0.08, weight: 0.7 },
    rapport: { label: "Rapport à faire",         gesture: "hold",   city: 0, unlockHours: 3,  euro: 10, hours: 0.15, weight: 0.5, holdMs: 1000 },
    devis:   { label: "Devis à valider",         gesture: "choice", city: 1, unlockHours: 0,  euro: 14, hours: 0.2,  weight: 0.6 },
    contrat: { label: "Contrat à signer",        gesture: "hold",   city: 2, unlockHours: 0,  euro: 22, hours: 0.3,  weight: 0.6, holdMs: 1400 },
  },

  queue: {
    capacity: 8,           // au-dela, le stress monte
    hardCapMult: 2,        // la file n'accepte plus de tache a capacity x 2
    baseSpawnEverySec: 6,  // taches "maison" (sans client), delai moyen
    startTasks: ["relance", "facture"],
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

  // --- Clients ---
  clients: {
    startOfferInSec: 12,        // premiere demande
    offerEverySec: 35,          // delai moyen entre deux demandes
    offerRepFactor: 0.92,       // x par point de reputation (arrivent plus vite)
    maxOffers: 3,
    maxClients: [6, 10, 14],    // par ville
    startSatisfaction: 60,
    payFullAbove: 50,           // en dessous, l'abonnement baisse proportionnellement
    satisfied: 90,              // seuil "client satisfait" (succes)
    // variations de satisfaction
    onManualFast: 2,  fastSec: 20,
    onManualSlow: 0.5,
    onAuto: 1.5,
    onBug: -4,
    overduePerSec: -0.15,       // par tache en retard dans la file
    stressMaxPerSec: -0.6,      // stress au maximum
    stressHighPerSec: -0.1,
    recoverPerSec: 0.05,        // retour lent vers le haut quand tout va bien
  },

  // taille des clients : plus gros = paye plus, envoie plus de taches
  sizes: {
    petit: { label: "Petit", pay: 0.15, taskEverySec: 14, minHours: 0,  minRep: 0 },
    moyen: { label: "Moyen", pay: 0.45, taskEverySec: 9,  minHours: 10, minRep: 0 },
    gros:  { label: "Gros",  pay: 1.2,  taskEverySec: 5,  minHours: 40, minRep: 0 },
  },

  sectors: {
    boulangerie: { label: "Boulangerie",        city: 0, minHours: 0,  tasks: ["facture", "relance"], names: ["Boulangerie Martin", "Le Fournil d'Anna", "Pains & Co", "Maison Gaudin"] },
    garage:      { label: "Garage",             city: 0, minHours: 0,  tasks: ["facture", "relance", "excel"], names: ["Garage Dupont", "Auto Service 16", "Carrosserie Moreau", "Garage des Lilas"] },
    btp:         { label: "Artisan BTP",        city: 0, minHours: 6,  tasks: ["facture", "excel", "rapport"], names: ["Menuiserie Roy", "Maçonnerie Bernard", "Toitures Faure", "Électricité Garnier"] },
    avocat:      { label: "Cabinet d'avocat",   city: 0, minHours: 15, tasks: ["relance", "rapport", "excel"], names: ["Cabinet Lefèvre", "Maître Vidal", "Cabinet Roche", "Avocats Delmas"] },
    logistique:  { label: "PME logistique",     city: 0, minHours: 25, tasks: ["excel", "rapport", "facture"], names: ["Transports Morel", "Logi16", "Express Charente", "Fret Atlantique"] },
    immo:        { label: "Agence immobilière", city: 1, minHours: 0,  tasks: ["devis", "relance", "rapport"], names: ["Immo Sarthe", "Maison & Cie", "Cénomans Immobilier", "Pierre Blanche"] },
    archi:       { label: "Cabinet d'architectes", city: 1, minHours: 0, tasks: ["devis", "excel", "rapport"], names: ["Atelier Mancel", "Studio 24h", "Archi Loir", "Cabinet Lemans"] },
    saas:        { label: "Start-up SaaS",      city: 2, minHours: 0,  tasks: ["contrat", "rapport", "excel"], names: ["Looply", "Nuagix", "Kodex", "Pixelmind"] },
    agence:      { label: "Agence de communication", city: 2, minHours: 0, tasks: ["contrat", "devis", "relance"], names: ["Studio Rive", "Agence Volt", "Plume & Pixel", "Maison Ouest"] },
  },

  // --- Workflows ---
  workflow: {
    baseRate: 0.05,         // taches/s avec un declencheur et une action de base, avant bonus
    noCheckBonus: 1.35,     // sans verification : plus rapide...
    bugChance: 0.12,        // ...mais chance de planter a chaque tache traitee
    crashSec: 8,            // duree d'un plantage
    duplicates: 2,          // taches renvoyees dans la file manuelle apres un bug
    backlogCap: 12,         // au-dela, les taches retombent dans la file manuelle
    yield: 0.8,             // part des gains d'une tache manuelle obtenue en automatique
    levelBonus: 0.3,        // +30 % de puissance par niveau de bloc
    maxBlockLevel: 5,
    blockUpgradeGrowth: 1.9,
    baseSlots: 3,           // declencheur, action, verification
  },

  // kind : trigger | action | check   ;  for : types de taches compatibles ("*" = tous)
  // speed : multiplicateur de cadence   ;  power : puissance d'une action
  blocks: {
    t_mail:  { kind: "trigger", label: "Nouvel e-mail",     desc: "Lance le workflow à chaque message reçu.", speed: 1.0,  cost: 0 },
    t_cron:  { kind: "trigger", label: "Planning horaire",  desc: "Vérifie la boîte à intervalles réguliers.", speed: 1.3,  cost: 6 },
    t_hook:  { kind: "trigger", label: "Webhook n8n",       desc: "Réagit instantanément aux événements.",    speed: 1.7,  cost: 30, needs: "yanis" },
    a_basic: { kind: "action",  label: "Saisie automatique", desc: "L'action de base, compatible partout.",     power: 1.0, for: "*", cost: 0 },
    a_tmpl:  { kind: "action",  label: "Modèle de message", desc: "Pré-remplit relances et rapports.",         power: 1.4, for: ["relance", "rapport", "devis", "contrat"], cost: 4 },
    a_ocr:   { kind: "action",  label: "Lecture OCR",       desc: "Lit les factures et les devis.",            power: 1.4, for: ["facture", "devis"], cost: 5 },
    a_sheet: { kind: "action",  label: "Connecteur tableur", desc: "Remplit les tableaux tout seul.",          power: 1.4, for: ["excel", "rapport"], cost: 5 },
    a_vba:   { kind: "action",  label: "Macro VBA",         desc: "Script Excel sur mesure.",                  power: 2.0, for: ["excel", "facture", "rapport"], cost: 22, needs: "yanis" },
    a_n8n:   { kind: "action",  label: "Scénario n8n",      desc: "Enchaîne plusieurs outils.",                power: 2.5, for: "*", cost: 45, needs: "yanis" },
    a_ai:    { kind: "action",  label: "Agent IA",          desc: "Comprend, rédige, décide.",                 power: 3.4, for: ["relance", "rapport", "facture", "devis", "contrat"], cost: 90, needs: "yanis" },
    c_rule:  { kind: "check",   label: "Règle de contrôle", desc: "Vérifie chaque résultat : plus de bugs, un peu plus lent.", speed: 0.7,  cost: 3 },
    c_cross: { kind: "check",   label: "Validation croisée", desc: "Double contrôle efficace.",                speed: 0.88, cost: 25 },
  },

  // --- Equipe ---
  // recruit : cout en EUR ; upgrade : cout du niveau n = base x growth^n ; unlockHours : visible a partir de
  team: {
    nahel: { name: "Nahel", role: "Fondateur, sur le terrain",
      desc: "C'est toi. Chaque niveau : +15 % de gains en traitement manuel et gestes plus rapides.",
      recruit: 0, upgrade: { base: 25, growth: 1.7 }, maxLevel: 10, unlockHours: 0,
      manualBonus: 0.15, holdFaster: 0.07, holdMin: 0.5 },
    yanis: { name: "Yanis", role: "Fondateur tech",
      desc: "Débloque les blocs avancés (VBA, n8n, agent IA). Chaque niveau : +20 % de vitesse des workflows. Niveau 3 et 6 : un emplacement en plus.",
      recruit: 120, upgrade: { base: 150, growth: 1.8 }, maxLevel: 8, unlockHours: 0,
      speedBonus: 0.2, slotLevels: [3, 6] },
    jadd: { name: "Jadd Barnas", role: "Ingénieur ouvreur de fenêtres",
      desc: "Ouvre régulièrement les fenêtres : la chaleur et le stress baissent. Chaque niveau : fenêtres plus fréquentes.",
      recruit: 250, upgrade: { base: 200, growth: 1.8 }, maxLevel: 8, unlockHours: 5,
      everySec: 40, everyFactor: 0.9, heatDrop: 18, stressDrop: 10 },
    noah: { name: "Noah", role: "Cybersécurité",
      desc: "Bloque automatiquement une partie des attaques. Chaque niveau : +10 % de blocage.",
      recruit: 400, upgrade: { base: 350, growth: 1.8 }, maxLevel: 8, unlockHours: 10,
      blockBase: 0.3, blockPerLevel: 0.1, blockMax: 0.9 },
  },

  servers: { max: 3, cost: 180, growth: 2.2, speedBonus: 0.18 },

  // --- Attaques (visent un workflow) ---
  attacks: {
    startHours: 12,         // heures gagnees avant la premiere attaque
    everySec: 110,
    tapsToRepel: 4,
    windowSec: 9,           // temps pour repousser
    pauseSec: 25,           // pause du workflow si l'attaque reussit
  },

  // --- Prestige : ouvrir une nouvelle agence ---
  prestige: {
    cities: ["Angoulême", "Le Mans", "Paris"],
    thresholds: [140, 280, 520],   // heures gagnees pour pouvoir ouvrir l'agence suivante
    repPerHours: 45,              // reputation gagnee = heures / ce nombre
    repBonus: 0.10,               // +10 % de gains par point de reputation
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
    { id: "first_wf",     label: "Premier workflow",      desc: "Faire tourner un workflow.",                   reward: { money: 50 } },
    { id: "all_types",    label: "Tout automatique",      desc: "Automatiser 4 types de tâches à la fois.",     reward: { mult: 0.03 } },
    { id: "no_bug_5",     label: "Zéro bug pendant 5 min", desc: "5 minutes de workflows sans aucun bug.",      reward: { mult: 0.03 } },
    { id: "first_bug",    label: "Première panne",        desc: "Subir un bug. Ça arrive aux meilleurs.",       reward: { money: 15 } },
    { id: "checked",      label: "Vérifié, contrôlé",     desc: "Faire tourner un workflow avec vérification.", reward: { money: 40 } },
    { id: "first_hire",   label: "Première recrue",       desc: "Recruter un membre de l'équipe.",              reward: { money: 60 } },
    { id: "full_team",    label: "Toute l'équipe",        desc: "Recruter Yanis, Jadd et Noah.",                reward: { mult: 0.04 } },
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

  // --- Tutoriel (5 bulles max) ---
  tutorial: [
    { who: "nahel", text: "Bienvenue chez K'X. Les tâches arrivent en continu : traite-les à la main pour gagner des euros et des heures." },
    { who: "nahel", text: "Facture : glisse-la dans le bon dossier. Relance : envoie-la. Chaque type a son geste." },
    { who: "yanis", text: "Onglet Clients : signe des clients. Ils paient un abonnement tant qu'ils sont satisfaits." },
    { who: "yanis", text: "Onglet Workflows : assemble des blocs pour automatiser un type de tâche. Sans vérification, c'est rapide mais ça peut planter." },
    { who: "jadd", text: "Surveille le stress et la chaleur. Et recrute-moi : j'ouvre les fenêtres, c'est mon métier." },
  ],
};
