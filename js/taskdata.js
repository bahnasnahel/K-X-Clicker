// Creation des taches et acces a la file (sans logique de jeu).
import { CONFIG } from "./config.js";
import { state } from "./state.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const HOLD_TEXTS = { rapport: "rapports", contrat: "contrats" };
const DEVIS_LINES = ["Main d'œuvre", "Matériel", "Déplacement", "Licence", "Formation", "Installation"];

function makeData(type) {
  const C = CONFIG.content;
  switch (CONFIG.tasks[type].gesture) {
    case "drag": return { ...pick(C.factures) };
    case "tap": return { ...pick(C.relances) };
    case "cells": {
      const cells = [];
      while (cells.length < 3) { const c = Math.floor(Math.random() * 9); if (!cells.includes(c)) cells.push(c); }
      return { title: pick(C.excels), cells };
    }
    case "hold": return { title: pick(C[HOLD_TEXTS[type]]) };
    case "choice": {
      const names = shuffle([...DEVIS_LINES]).slice(0, 3);
      const lines = names.map((l) => ({ l, a: (4 + Math.floor(Math.random() * 27)) * 10 }));
      const sum = lines.reduce((s, x) => s + x.a, 0);
      const opts = new Set([sum]);
      while (opts.size < 3) opts.add(Math.max(10, sum + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4)) * 10));
      return { title: pick(C.devis), lines, options: shuffle([...opts]), answer: sum };
    }
  }
}

// d = difficulte : une automatisation de niveau inferieur ne peut pas la traiter
export function makeTask(type, client = null, d = 1) {
  return { id: state.nextTaskId++, type, client, d, born: state.stats.playSeconds, data: makeData(type) };
}

export const queueLimit = () => CONFIG.queue.capacity * CONFIG.queue.hardCapMult;

// Retourne false si la file est pleine.
export function enqueue(task) {
  if (state.queue.length >= queueLimit()) return false;
  state.queue.push(task);
  return true;
}
