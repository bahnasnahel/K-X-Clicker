import { CONFIG } from "./config.js";

export function defaults() {
  const now = Date.now();
  return {
    v: CONFIG.save.version,
    money: 0,
    hoursSaved: 0,        // heures gagnees disponibles : viennent UNIQUEMENT de l'automatisation
    hoursRun: 0,          // heures gagnees dans l'agence courante (prestige)
    lifetimeHours: 0,     // toutes agences confondues
    runMoney: 0,          // argent gagne dans l'agence courante (deblocage des employes)
    stress: 0,
    city: 0,
    reputation: 0,
    credibility: CONFIG.credibility.start,
    bonusMult: 0,         // bonus permanent des succes
    queue: [],
    nextTaskId: 1,
    nextClientId: 1,
    flags: {},            // contenu debloque (onglets, types de taches, compteurs, directeurs)
    seen: {},             // onglets deja ouverts
    offers: [],
    clients: [],
    auto: {},             // automatisation par type de tache
    staff: [],            // ids des employes embauches (data/employees.json)
    assign: {},           // id du membre du personnel -> id du client
    autoAssign: true,
    office: 0,            // niveau du bureau : limite le nombre d'employes
    ads: { client: null, recruit: null },   // campagnes en cours : { end } (temps de jeu)
    candidates: [],       // profils proposes par les campagnes de recrutement
    people: {},           // profils generes (employes qui ne sont pas dans data/employees.json)
    nextPersonId: 1,
    photos: {},           // cle (client ou employe) -> photo, sans doublon
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
      moneyEarned: 0, lawsuits: 0, adsLaunched: 0,
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

export function normalize() {}

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

// Nahel : +10 % d'argent par niveau, x1,5 tous les 5 niveaux
export function nahelMult() {
  const N = CONFIG.team.nahel, l = state.team.nahel.lvl;
  return (1 + N.moneyPerLevel * l) * Math.pow(N.bigBoost, Math.floor(l / N.bigBoostEvery));
}
// Yanis : x1,5 sur les heures automatisees tous les 5 niveaux
export function yanisHoursMult() {
  const Y = CONFIG.team.yanis, y = state.team.yanis;
  return y.on ? Math.pow(Y.hoursBoost, Math.floor(y.lvl / Y.hoursEvery)) : 1;
}
// Le stress reduit tous les gains
export function stressMult() {
  const S = CONFIG.stress;
  const f = Math.min(1, Math.max(0, (state.stress - S.gainPenaltyStart) / (S.max - S.gainPenaltyStart)));
  return 1 - S.gainPenaltyMax * f;
}

// Ajoute des gains (reputation, succes, Nahel, stress). Retourne les gains reels.
// Les heures viennent uniquement de l'automatisation.
export function earn(euro, hours, extra = 1, hoursExtra = 1) {
  const m = gainMult() * stressMult();
  const e = euro * m * nahelMult() * extra, h = hours * m * hoursExtra;
  state.money += e;
  state.runMoney += e;
  state.stats.moneyEarned += e;
  if (h > 0) { state.hoursSaved += h; state.hoursRun += h; state.lifetimeHours += h; }
  return { euro: e, hours: h };
}

export const office = () => CONFIG.office.levels[Math.min(state.office, CONFIG.office.levels.length - 1)];
export const staffCap = () => office().staff;
