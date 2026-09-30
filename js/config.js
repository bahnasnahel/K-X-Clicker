// ============================================================
//  K'X Clicker - CONFIG D'EQUILIBRAGE
//  Toutes les valeurs de jeu (prix, gains, durees, seuils) sont ici.
//  Modifie ce fichier pour ajuster le jeu, rien d'autre a toucher.
// ============================================================

export const CONFIG = {
  slogan: "Reprenez le temps que vos processus vous prennent.",

  // --- Sauvegarde ---
  save: {
    key: "kx-clicker-save",
    version: 1,
    intervalMs: 10000,
  },

  // --- Boucle ---
  loop: {
    stepMs: 100,          // pas de simulation fixe
    maxCatchUpMs: 1000,   // au-dela, on considere que le jeu etait en pause
  },

  // --- Gains hors ligne ---
  offline: {
    rate: 0.5,            // 50 % des abonnements
    capHours: 8,          // plafond
    minAwaySeconds: 60,   // en dessous, pas d'ecran recap
  },

  // --- Bureau pixel : evolue avec les heures gagnees ---
  desk: [
    { minHours: 0,   label: "Un PC pour commencer" },
    { minHours: 20,  label: "Un deuxième écran" },
    { minHours: 80,  label: "Trois écrans et un serveur" },
    { minHours: 250, label: "Salle des serveurs" },
  ],

  // --- Jauges ---
  stress: {
    max: 100,
    decayPerSec: 1.5,      // baisse naturelle quand la file est sous sa capacite
    overflowPerSec: 2,     // par tache au-dela de la capacite
    mistake: 4,            // erreur de geste (mauvais dossier, mauvaise case)
  },
  heat: { max: 100, decayPerSec: 0.5 },

  // --- Types de taches ---
  // unlockHours : heures gagnees necessaires pour que le type apparaisse dans la file
  tasks: {
    facture: { label: "Facture à saisir",        unlockHours: 0,  euro: 4,  hours: 0.05, weight: 1.0 },
    relance: { label: "Relance à envoyer",       unlockHours: 0,  euro: 3,  hours: 0.03, weight: 1.0 },
    excel:   { label: "Tableau Excel à remplir", unlockHours: 1,  euro: 6,  hours: 0.08, weight: 0.7 },
    rapport: { label: "Rapport à faire",         unlockHours: 3,  euro: 10, hours: 0.15, weight: 0.5, holdMs: 1000 },
  },

  queue: {
    capacity: 8,           // au-dela, le stress monte
    hardCapMult: 2,        // la file n'accepte plus de tache a capacity x 2
    spawnEverySec: 3.5,    // delai moyen entre deux arrivees
    startTasks: ["relance", "facture"],
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
      { who: "Garage Dupont",        txt: "Facture n°214 impayée depuis 30 jours." },
      { who: "Boulangerie Martin",   txt: "Devis envoyé la semaine dernière, sans réponse." },
      { who: "Cabinet Lefèvre",      txt: "Rappel : pièces manquantes au dossier." },
      { who: "Transports Morel",     txt: "Facture n°98 arrive à échéance." },
      { who: "Menuiserie Roy",       txt: "Confirmation de rendez-vous à obtenir." },
    ],
    excels: ["Suivi des stocks", "Planning des livraisons", "Temps passé par client", "Budget du mois"],
    rapports: ["Rapport mensuel d'activité", "Bilan des interventions", "Point hebdo direction", "Synthèse des impayés"],
  },

  // --- Equipe (textes et roles ; couts ajoutes aux etapes suivantes) ---
  team: {
    nahel: { name: "Nahel", role: "Fondateur, sur le terrain",
      desc: "C'est toi. Tes améliorations rendent le traitement manuel plus rapide et plus rentable." },
    yanis: { name: "Yanis", role: "Fondateur tech",
      desc: "Débloque les blocs avancés (VBA, n8n, agent IA) et accélère les workflows." },
    noah:  { name: "Noah", role: "Cybersécurité",
      desc: "Bloque une partie des attaques. Le reste, c'est à toi de les repousser." },
    jadd:  { name: "Jadd Barnas", role: "Ingénieur ouvreur de fenêtres",
      desc: "Ouvre les fenêtres : fait baisser la chaleur et le stress." },
  },

  // --- Villes (prestige) ---
  cities: ["Angoulême", "Le Mans", "Paris"],
};
