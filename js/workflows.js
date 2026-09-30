// Automatisation : un niveau par type de tache. Plus le niveau est haut, plus c'est rapide
// et plus de taches difficiles sont gerees. Verification = plus sur mais plus lent.
import { CONFIG } from "./config.js";
import { state, earn } from "./state.js";
import { addSystem } from "./loop.js";
import { emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { makeTask, enqueue } from "./taskdata.js";

const A = CONFIG.auto;

export function auto(type) {
  return (state.auto[type] ||= { level: 0, verify: true, backlog: [], progress: 0, pausedUntil: 0, crashedUntil: 0 });
}
export const level = (type) => (state.auto[type] ? state.auto[type].level : 0);
export const isActive = (type) => level(type) > 0;
export const verifyOn = (type) => !state.auto[type] || state.auto[type].verify;
export const activeTypes = () => Object.keys(state.auto).filter(isActive);
export const activeCount = () => activeTypes().length;
export const diffMult = (d) => 1 + CONFIG.difficultyBonus * (Math.max(1, d || 1) - 1);

export function heatFactor() {
  const H = CONFIG.heat;
  return 1 - H.slowMax * clamp((state.heat - H.slowStart) / (H.max - H.slowStart), 0, 1);
}

// taches traitees par seconde
export function rate(type) {
  const L = level(type);
  if (L <= 0) return 0;
  const y = state.team.yanis;
  const team = y.on ? 1 + y.lvl * CONFIG.team.yanis.speedBonus : 1;
  const srv = 1 + state.servers * CONFIG.servers.speedBonus;
  return A.baseRate * Math.pow(A.rateGrowth, L - 1) * (verifyOn(type) ? A.verifySpeed : A.noVerifyBonus) * team * srv * heatFactor();
}

export function status(type) {
  if (!isActive(type)) return "off";
  const w = state.auto[type], now = state.stats.playSeconds;
  if (now < w.pausedUntil) return "paused";
  if (now < w.crashedUntil) return "crashed";
  return "ok";
}

// ---- achats ----
export const installCost = (type) => A.installCost[type];                                   // EUR, niveau 1
export const upgradeCost = (type) => Math.round(A.hoursBase * Math.pow(A.hoursGrowth, level(type) - 1) * A.hoursMult[type]);   // heures
export const needsYanis = (type) => level(type) + 1 >= A.needsYanisFrom && !state.team.yanis.on;
export const atMax = (type) => level(type) >= A.maxLevel;

export function canUpgrade(type) {
  if (atMax(type) || needsYanis(type)) return false;
  return level(type) === 0 ? state.money >= installCost(type) : state.hoursSaved >= upgradeCost(type);
}

export function upgrade(type) {
  if (!canUpgrade(type)) return false;
  if (level(type) === 0) state.money -= installCost(type);
  else state.hoursSaved -= upgradeCost(type);
  auto(type).level++;
  sfx.unlock();
  return true;
}

export function setVerify(type, v) { auto(type).verify = v; sfx.tap(); }

// ---- traitement ----
export const canHandle = (type, d) => level(type) >= Math.max(1, d || 1);

// Appele a la creation d'une tache : true si l'automatisation la prend en charge.
export function tryAutomate(task) {
  if (!canHandle(task.type, task.d)) return false;
  const w = auto(task.type);
  if (w.backlog.length >= A.backlogCap) return false;
  w.backlog.push({ id: task.id, type: task.type, client: task.client, d: task.d || 1, born: task.born });
  return true;
}

function processOne(type, w, item) {
  const now = state.stats.playSeconds;
  if (!w.verify && Math.random() < A.bugChance) {
    w.crashedUntil = now + A.crashSec;
    state.stats.bugs++;
    state.stats.cleanSince = now;
    for (let i = 0; i < A.duplicates; i++) enqueue(makeTask(type, item.client, item.d));
    emit("bug", { client: item.client, type });
    sfx.error();
    toast(`Bug sur « ${CONFIG.tasks[type].label} » : ${A.duplicates} tâches renvoyées.`);
    return;
  }
  const c = CONFIG.tasks[type], m = diffMult(item.d);
  earn(c.euro * A.euroYield * m, c.hours * m);
  state.stats.autoDone++;
  emit("task", { task: item, auto: true });
}

function tick(dt) {
  const now = state.stats.playSeconds;
  for (const type of Object.keys(state.auto)) {
    const w = state.auto[type];
    if (w.level <= 0) continue;
    // retire de la file manuelle les taches que l'automatisation sait traiter
    for (let i = state.queue.length - 1; i >= 0 && w.backlog.length < A.backlogCap; i--) {
      const t = state.queue[i];
      if (t.type === type && canHandle(type, t.d)) { state.queue.splice(i, 1); w.backlog.push({ id: t.id, type, client: t.client, d: t.d || 1, born: t.born }); }
    }
    if (now < w.crashedUntil || now < w.pausedUntil) continue;
    w.progress += rate(type) * dt;
    while (w.progress >= 1 && w.backlog.length) { w.progress -= 1; processOne(type, w, w.backlog.shift()); }
    if (!w.backlog.length) w.progress = Math.min(w.progress, 1);
  }
  const s = state.stats;
  if (activeCount() === 0) s.cleanSince = null;
  else if (s.cleanSince == null) s.cleanSince = now;
}

export function initWorkflows() { addSystem(tick); }
