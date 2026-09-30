// Workflows : blocs, cadence, traitement automatique, bugs.
import { CONFIG } from "./config.js";
import { state, earn } from "./state.js";
import { addSystem } from "./loop.js";
import { emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { makeTask, enqueue } from "./taskdata.js";

const K = CONFIG.blocks;
const W = CONFIG.workflow;

export const blockLevel = (id) => state.blocks[id] || 0;
export const lvlMult = (id) => 1 + W.levelBonus * (Math.max(1, blockLevel(id)) - 1);
export const blockUnlocked = (id) => !K[id].needs || state.team[K[id].needs].on;
export const blockFits = (id, type) => K[id].kind !== "action" || K[id].for === "*" || K[id].for.includes(type);

// emplacements : declencheur + N actions + verification
export function actionSlots() {
  const y = state.team.yanis;
  const extra = y.on ? CONFIG.team.yanis.slotLevels.filter((l) => y.lvl >= l).length : 0;
  return W.baseSlots - 2 + extra;
}
export const slotCount = () => actionSlots() + 2;

export function wf(type) {
  return (state.workflows[type] ||= { trigger: null, actions: [], check: null, backlog: [], progress: 0, pausedUntil: 0, crashedUntil: 0 });
}

const owned = (id) => id && blockLevel(id) > 0;

export function setSlot(type, slot, id) {          // slot : "trigger" | "check" | indice d'action
  const w = wf(type);
  if (slot === "trigger") w.trigger = id;
  else if (slot === "check") w.check = id;
  else w.actions[slot] = id;
}

export function activeActions(type) {
  const w = state.workflows[type];
  if (!w) return [];
  return w.actions.slice(0, actionSlots()).filter((a) => owned(a) && blockFits(a, type));
}

export function isActive(type) {
  const w = state.workflows[type];
  return !!(w && owned(w.trigger) && activeActions(type).length > 0);
}
export const hasCheck = (type) => !!(state.workflows[type] && owned(state.workflows[type].check));
export const activeTypes = () => Object.keys(state.workflows).filter(isActive);
export const activeCount = () => activeTypes().length;

export function heatFactor() {
  const H = CONFIG.heat;
  return 1 - H.slowMax * clamp((state.heat - H.slowStart) / (H.max - H.slowStart), 0, 1);
}

// taches traitees par seconde
export function rate(type) {
  if (!isActive(type)) return 0;
  const w = state.workflows[type];
  const trig = K[w.trigger].speed * lvlMult(w.trigger);
  const acts = activeActions(type).reduce((s, a) => s + K[a].power * lvlMult(a), 0);
  let chk = W.noCheckBonus;
  if (hasCheck(type)) chk = Math.min(1, K[w.check].speed * (1 + 0.1 * (blockLevel(w.check) - 1)));
  const y = state.team.yanis;
  const team = y.on ? 1 + y.lvl * CONFIG.team.yanis.speedBonus : 1;
  const srv = 1 + state.servers * CONFIG.servers.speedBonus;
  return W.baseRate * trig * acts * chk * team * srv * heatFactor();
}

export function status(type) {
  if (!isActive(type)) return "off";
  const w = state.workflows[type], now = state.stats.playSeconds;
  if (now < w.pausedUntil) return "paused";
  if (now < w.crashedUntil) return "crashed";
  return "ok";
}

// ---------- Achats ----------
export function buyCost(id) { return K[id].cost; }
export function upgradeCost(id) { return Math.round(Math.max(K[id].cost, 4) * Math.pow(W.blockUpgradeGrowth, blockLevel(id))); }

export function buyOrUpgrade(id) {
  if (!blockUnlocked(id)) return false;
  const lvl = blockLevel(id);
  if (lvl >= W.maxBlockLevel) return false;
  const cost = lvl === 0 ? buyCost(id) : upgradeCost(id);
  if (state.hoursSaved < cost) return false;
  state.hoursSaved -= cost;
  state.blocks[id] = lvl + 1;
  sfx.unlock();
  return true;
}

// ---------- Traitement ----------
// Appele a la creation d'une tache : true si un workflow la prend en charge.
export function tryAutomate(task) {
  if (!isActive(task.type)) return false;
  const w = wf(task.type);
  if (w.backlog.length >= W.backlogCap) return false;
  w.backlog.push({ id: task.id, type: task.type, client: task.client, born: task.born });
  return true;
}

function processOne(type, w, item) {
  const now = state.stats.playSeconds;
  if (!hasCheck(type) && Math.random() < W.bugChance) {
    w.crashedUntil = now + W.crashSec;
    state.stats.bugs++;
    state.stats.cleanSince = now;
    for (let i = 0; i < W.duplicates; i++) enqueue(makeTask(type, item.client));
    emit("bug", { client: item.client, type });
    sfx.error();
    toast(`Bug sur le workflow « ${CONFIG.tasks[type].label} » : ${W.duplicates} tâches renvoyées.`);
    return;
  }
  const c = CONFIG.tasks[type];
  earn(c.euro, c.hours, W.yield);
  state.stats.autoDone++;
  emit("task", { task: item, auto: true });
}

function tick(dt) {
  const now = state.stats.playSeconds;
  for (const type of Object.keys(state.workflows)) {
    const w = state.workflows[type];
    if (!isActive(type)) {                 // workflow vide ou invalide : on rend les taches
      while (w.backlog.length) { const b = w.backlog.shift(); if (!enqueue({ ...b, data: makeTask(type).data })) break; }
      w.backlog.length = 0; w.progress = 0;
      continue;
    }
    // retire les taches de ce type de la file manuelle
    for (let i = state.queue.length - 1; i >= 0 && w.backlog.length < W.backlogCap; i--) {
      if (state.queue[i].type === type) { const [t] = state.queue.splice(i, 1); w.backlog.push({ id: t.id, type, client: t.client, born: t.born }); }
    }
    if (now < w.crashedUntil || now < w.pausedUntil) continue;
    w.progress += rate(type) * dt;
    while (w.progress >= 1 && w.backlog.length) { w.progress -= 1; processOne(type, w, w.backlog.shift()); }
    if (!w.backlog.length) w.progress = Math.min(w.progress, 1);
  }
  // serie sans bug (succes)
  const s = state.stats;
  if (activeCount() === 0) s.cleanSince = null;
  else if (s.cleanSince == null) s.cleanSince = now;
}

export function initWorkflows() { addSystem(tick); }
