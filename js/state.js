import { CONFIG } from "./config.js";

export function defaults() {
  const now = Date.now();
  return {
    v: CONFIG.save.version,
    money: 0,
    hoursSaved: 0,        // heures gagnees disponibles (se depensent en blocs)
    hoursRun: 0,          // heures gagnees dans l'agence courante (progression, prestige)
    lifetimeHours: 0,     // toutes agences confondues
    stress: 0,
    heat: 0,
    city: 0,
    reputation: 0,
    bonusMult: 0,         // bonus permanent des succes
    queue: [],
    nextTaskId: 1,
    nextClientId: 1,
    unlocked: { facture: true, relance: true, excel: false, rapport: false, devis: false, contrat: false },
    offers: [],
    clients: [],
    workflows: {},        // par type de tache
    blocks: {},           // id de bloc -> niveau
    servers: 0,
    attack: null,
    team: {
      nahel: { on: true,  lvl: 0 },
      yanis: { on: false, lvl: 0 },
      jadd:  { on: false, lvl: 0 },
      noah:  { on: false, lvl: 0 },
    },
    achievements: {},
    stats: {
      tasksDone: 0, autoDone: 0, playSeconds: 0, bugs: 0, cleanSince: null,
      attacksRepelled: 0, windowsOpened: 0, clientsSigned: 0, clientsSatisfied: 0,
      moneyEarned: 0,
    },
    settings: { muted: false, tutorialDone: false, speed: 1, gain: 1 },   // speed et gain : mode triche
    meta: { created: now, lastSave: now, lastActive: now },
  };
}

export const state = defaults();

// Recopie les valeurs sauvegardees. Un objet vide dans les valeurs par defaut
// (workflows, blocks, achievements) est recopie en entier, les autres cle par cle.
function assign(target, src) {
  for (const k of Object.keys(target)) {
    if (!(k in src)) continue;
    const t = target[k], s = src[k];
    const plain = t && typeof t === "object" && !Array.isArray(t);
    if (plain && Object.keys(t).length > 0 && s && typeof s === "object") assign(t, s);
    else target[k] = s;
  }
}

export function normalize() {
  state.blocks.t_mail ||= 1;
  state.blocks.a_basic ||= 1;
}

export function load() {
  try {
    const raw = localStorage.getItem(CONFIG.save.key);
    if (!raw) { normalize(); return false; }
    const saved = JSON.parse(raw);
    if (saved.v !== CONFIG.save.version) { normalize(); return false; }
    assign(state, saved);
    normalize();
    return true;
  } catch (e) {
    console.warn("Sauvegarde illisible", e);
    normalize();
    return false;
  }
}

export function save() {
  try {
    state.meta.lastSave = Date.now();
    localStorage.setItem(CONFIG.save.key, JSON.stringify(state));
  } catch (e) {
    console.warn("Sauvegarde impossible", e);
  }
}

export function reset() {
  const muted = state.settings.muted;
  const cheat = { speed: state.settings.speed, gain: state.settings.gain };
  try { localStorage.removeItem(CONFIG.save.key); } catch (e) {}
  const fresh = defaults();
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh);
  state.settings.muted = muted;
  state.settings.speed = cheat.speed; state.settings.gain = cheat.gain;
  normalize();
  save();
}

export function startAutosave() {
  setInterval(save, CONFIG.save.intervalMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
  window.addEventListener("pagehide", save);
}

// ---------- Gains ----------
export function gainMult() {
  return (1 + state.reputation * CONFIG.prestige.repBonus + state.bonusMult) * (state.settings.gain || 1);
}

// Ajoute des gains (avec bonus de reputation et de succes). Retourne les gains reels.
export function earn(euro, hours, extra = 1) {
  const m = gainMult() * extra;
  const e = euro * m, h = hours * m;
  state.money += e;
  state.hoursSaved += h;
  state.hoursRun += h;
  state.lifetimeHours += h;
  state.stats.moneyEarned += e;
  return { euro: e, hours: h };
}

// niveau du bureau (nombre d'ecrans) selon les heures gagnees dans l'agence
export function deskLevel() {
  let lvl = 0;
  CONFIG.desk.forEach((d, i) => { if (state.hoursRun >= d.minHours) lvl = i; });
  return lvl;
}
