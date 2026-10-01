import { CONFIG } from "./config.js";

// Champs propres a UNE agence : ils sont rangés dans state.cities[i].data quand tu diriges une autre agence.
// Tout le reste (points, boutique, succes, statistiques, explications) est commun a l'entreprise.
// L'argent est propre a chaque agence ; il n'est commun que pour ACHETER une nouvelle agence.
export const AGENCY_FIELDS = ["money", "hoursSaved", "hoursRun", "runMoney", "stress", "credibility", "queue", "offers", "clients", "auto",
  "staff", "assign", "autoAssign", "office", "ads", "candidates", "people", "photos", "attack", "sec", "enemies", "team", "freeAds"];

const shopLvl = (st, id) => (st.shop && st.shop[id]) || 0;

// Etat de depart d'une agence (la boutique permanente donne des departs plus forts)
export function freshAgencyFields(city, st = state) {
  const lvl = (id) => shopLvl(st, id);
  const auto = {};
  const types = Object.keys(CONFIG.tasks).filter((k) => CONFIG.tasks[k].city <= city);
  types.slice(0, lvl("startAuto")).forEach((t) => { auto[t] = { level: 1, verify: true, backlog: [], progress: 0, pausedUntil: 0, crashedUntil: 0, upgrading: null }; });
  const dir = lvl("startDir");
  return {
    money: CONFIG.shop.items.find((i) => i.id === "startMoney").per * lvl("startMoney"),   // argent de cette agence (depart de la boutique)
    hoursSaved: 0,        // heures gagnees disponibles : viennent UNIQUEMENT de l'automatisation
    hoursRun: 0,          // heures gagnees dans cette agence (difficulte, points de remise a zero)
    runMoney: 0,          // argent gagne dans cette agence (deblocage des rangs de clients)
    stress: 0,
    credibility: Math.min(100, CONFIG.credibility.start + CONFIG.shop.items.find((i) => i.id === "startCred").per * lvl("startCred")),
    queue: [],
    offers: [],
    clients: [],
    auto,                 // automatisation par type de tache
    staff: [],            // ids des employes embauches
    assign: {},           // id du membre du personnel -> id du client
    autoAssign: true,
    office: Math.min(CONFIG.office.levels.length - 1, lvl("startOffice")),
    ads: { client: null, recruit: null },   // campagnes en cours : { end } (temps de jeu)
    candidates: [],       // profils proposes par les campagnes de recrutement
    people: {},           // profils generes
    photos: {},           // cle (client ou employe) -> photo, sans doublon
    attack: null,         // incident de securite en cours : { kind, type, power, deadline, ... }
    enemies: [],          // ennemis actifs : { id, name, lvl, style, kind, hp, maxHp, power, every, next }
    sec: {},              // mesures de securite : id -> niveau
    freeAds: { client: lvl("freeAds"), recruit: lvl("freeAds") },   // campagnes gratuites restantes
    team: {
      nahel: { on: true,  lvl: dir },
      yanis: { on: false, lvl: 0 },
      jadd:  { on: false, lvl: 0 },
      noah:  { on: false, lvl: 0, mode: "strong" },
    },
  };
}

export function defaults() {
  const now = Date.now();
  return {
    v: CONFIG.save.version,
    lifetimeHours: 0,     // heures gagnees, toutes agences et toutes remises a zero confondues
    points: 0,            // points de la boutique permanente (disponibles)
    pointsEarned: 0,      // points gagnes au total
    rebirths: 0,
    shop: {},             // boutique permanente : id -> niveau
    cities: CONFIG.prestige.cities.map((_, i) => ({ unlocked: i === 0, data: null, passive: { euro: 0, hours: 0 } })),
    flow: { accE: 0, accH: 0, euro: 0, hours: 0 },   // rythme recent (abonnements + automatisations) de l'agence active
    city: 0,              // agence que tu diriges en ce moment
    bonusMult: 0,         // bonus permanent des succes
    nextTaskId: 1,
    nextClientId: 1,
    nextPersonId: 1,
    nextEnemyId: 1,
    flags: {},            // contenu debloque (onglets, types de taches, compteurs, directeurs)
    seen: {},             // onglets deja ouverts
    ...freshAgencyFields(0, { shop: {} }),
    achievements: {},
    stats: {
      tasksDone: 0, autoDone: 0, playSeconds: 0, bugs: 0, cleanSince: null,
      attacksRepelled: 0, windowsOpened: 0, clientsSigned: 0, clientsSatisfied: 0,
      moneyEarned: 0, lawsuits: 0, adsLaunched: 0, enemiesDestroyed: 0,
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

// Ancien format d'attaque (a taper) : on l'abandonne.
export function normalize() { if (state.attack && !state.attack.kind) state.attack = null; if (!state.sec) state.sec = {}; if (!state.enemies) state.enemies = []; }

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
  return (1 + state.bonusMult) * (state.settings.gain || 1);
}

// Nahel : +10 % d'argent par niveau, x1,5 tous les 5 niveaux
export function nahelMult() {
  const N = CONFIG.team.nahel, l = state.team.nahel.lvl;
  return (1 + N.moneyPerLevel * l) * Math.pow(N.bigBoost, Math.floor(l / N.bigBoostEvery));
}
// Yanis : x2 sur les heures automatisees tous les 5 niveaux
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

// bonus de la boutique permanente : +per % par niveau
export const shopPct = (id) => {
  const it = CONFIG.shop.items.find((i) => i.id === id);
  return 1 + (it ? (it.per * (state.shop[id] || 0)) / 100 : 0);
};
// reduction de la boutique : 1 = prix normal
export const shopDiscount = (id) => {
  const it = CONFIG.shop.items.find((i) => i.id === id);
  return Math.max(0.3, 1 - (it ? (it.per * (state.shop[id] || 0)) / 100 : 0));
};

// Ajoute des gains (succes, Nahel, stress, boutique). Retourne les gains reels.
// Les heures viennent uniquement de l'automatisation.
export function earn(euro, hours, extra = 1, hoursExtra = 1) {
  const m = gainMult() * stressMult();
  const e = euro * m * nahelMult() * extra, h = hours * m * hoursExtra * shopPct("hoursGain");
  state.money += e;
  state.runMoney += e;
  state.stats.moneyEarned += e;
  if (h > 0) { state.hoursSaved += h; state.hoursRun += h; state.lifetimeHours += h; }
  return { euro: e, hours: h };
}

// Rythme de l'agence active (sans les tâches à la main) : sert à faire tourner les autres agences.
export function noteFlow(euro, hours) { state.flow.accE += euro; state.flow.accH += hours; }

// Score de securite (0 a 100) : somme des points des mesures achetees dans l'agence. Les gros clients en exigent un.
export const securityScore = () => Math.min(100, CONFIG.security.measures.reduce((s, m) => s + m.pts * ((state.sec && state.sec[m.id]) || 0), 0));

export const office = () => CONFIG.office.levels[Math.min(state.office, CONFIG.office.levels.length - 1)];
export const staffCap = () => office().staff;
