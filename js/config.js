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
  stress: { max: 100, decayPerSec: 1.5 },
  heat:   { max: 100, decayPerSec: 0.5 },

  // --- Types de taches (etape 3) ---
  tasks: {
    facture: { label: "Facture à saisir",      gesture: "drag",  euro: 4,  hours: 0.05, weight: 1.0 },
    relance: { label: "Relance à envoyer",     gesture: "tap",   euro: 3,  hours: 0.03, weight: 1.0 },
    excel:   { label: "Tableau Excel à remplir", gesture: "cells", euro: 6,  hours: 0.08, weight: 0.7 },
    rapport: { label: "Rapport à faire",       gesture: "hold",  euro: 10, hours: 0.15, weight: 0.5 },
  },

  queue: {
    capacity: 8,
    spawnEverySec: 4,
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
