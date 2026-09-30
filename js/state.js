import { CONFIG } from "./config.js";

function defaults() {
  const now = Date.now();
  return {
    v: CONFIG.save.version,
    money: 0,
    hoursSaved: 0,        // heures gagnees dans l'agence courante
    lifetimeHours: 0,     // toutes agences confondues
    stress: 0,
    heat: 0,
    city: 0,
    reputation: 0,
    queue: [],
    clients: [],
    workflows: [],
    team: { nahel: true, yanis: false, noah: false, jadd: false },
    upgrades: {},
    achievements: {},
    stats: { tasksDone: 0, playSeconds: 0 },
    settings: { muted: false, tutorialDone: false },
    meta: { created: now, lastSave: now },
  };
}

export const state = defaults();

function assign(target, src) {
  for (const k of Object.keys(target)) {
    if (!(k in src)) continue;
    const t = target[k], s = src[k];
    if (t && typeof t === "object" && !Array.isArray(t) && s && typeof s === "object") assign(t, s);
    else target[k] = s;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(CONFIG.save.key);
    if (!raw) return false;
    assign(state, JSON.parse(raw));
    // les objets a cles libres (upgrades, achievements) sont recopies tels quels
    const saved = JSON.parse(raw);
    state.upgrades = saved.upgrades || {};
    state.achievements = saved.achievements || {};
    return true;
  } catch (e) {
    console.warn("Sauvegarde illisible", e);
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
  const keep = { ...state.settings };
  try { localStorage.removeItem(CONFIG.save.key); } catch (e) {}
  const fresh = defaults();
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh);
  state.settings.muted = keep.muted;
  save();
}

export function startAutosave() {
  setInterval(save, CONFIG.save.intervalMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
  window.addEventListener("pagehide", save);
}

// niveau du bureau selon les heures gagnees
export function deskLevel() {
  let lvl = 0;
  CONFIG.desk.forEach((d, i) => { if (state.hoursSaved >= d.minHours) lvl = i; });
  return lvl;
}
