// Logique de la file de taches (sans interface).
import { CONFIG } from "./config.js";
import { state, earn } from "./state.js";
import { addSystem } from "./loop.js";
import { emit, on } from "./events.js";
import { sfx } from "./audio.js";
import { clamp } from "./util.js";
import { makeTask, enqueue, nextStep } from "./taskdata.js";
import { tryAutomate, diffMult } from "./workflows.js";

let spawnTimer = 0;

export function isUnlocked(type) {
  const c = CONFIG.tasks[type];
  return c.city <= state.city && (type === "relance" || !!state.flags[type]);
}
export const availableTypes = () => Object.keys(CONFIG.tasks).filter(isUnlocked);

// Les gains de Nahel (+10 % par niveau, gros boost tous les 5) sont appliques dans state.earn.
export const manualMult = () => 1;

// Duree du maintien d'un geste "hold", raccourcie par les ameliorations de Nahel.
export function holdMs(type) {
  const N = CONFIG.team.nahel;
  return CONFIG.tasks[type].holdMs * Math.max(N.holdMin, 1 - state.team.nahel.lvl * N.holdFaster);
}

function pickType() {
  const types = availableTypes();
  let total = 0; types.forEach((k) => (total += CONFIG.tasks[k].weight));
  let r = Math.random() * total;
  return types.find((k) => (r -= CONFIG.tasks[k].weight) < 0) || types[0];
}

// Difficulte des taches "maison" : monte avec les heures gagnees dans l'agence et avec les villes.
export function baseDifficulty() {
  const D = CONFIG.difficulty;
  return Math.min(D.max, 1 + Math.floor(state.hoursRun / D.hoursPerStep) + state.city * D.perCity);
}

// Les taches plus dures arrivent moins vite.
export const arrivalFactor = () => 1 + CONFIG.difficulty.slowArrival * (baseDifficulty() - 1);

// Cree une tache : un workflow la prend ou elle rejoint la file manuelle.
export function spawnTask(type, client = null, d = null) {
  const t = makeTask(type || pickType(), client, d == null ? baseDifficulty() : d);
  if (tryAutomate(t)) return;
  if (!enqueue(t) && client) emit("taskLost", t);
}

// Valide une etape d'une tache a la main. Retourne les gains quand la derniere etape est faite,
// { step } si il reste des etapes, ou null si la tache n'existe plus.
export function advanceTask(id) {
  const t = state.queue.find((x) => x.id === id);
  if (!t) return null;
  if ((t.step || 0) + 1 < (t.steps || 1)) { nextStep(t); return { step: t.step }; }
  return completeTask(id);
}

// Retourne les gains, ou null si la tache n'existe plus.
export function completeTask(id) {
  const i = state.queue.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const task = state.queue[i];
  const cfg = CONFIG.tasks[task.type];
  const gain = earn(cfg.euro * diffMult(task.d), 0, manualMult());    // a la main : des euros, pas d'heures
  state.queue.splice(i, 1);
  state.stats.tasksDone++;
  emit("task", { task, auto: false, age: state.stats.playSeconds - task.born });
  return gain;
}

export function mistake() {
  state.stress = clamp(state.stress + CONFIG.stress.mistake, 0, CONFIG.stress.max);
  sfx.error();
}

function tick(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    if (state.queue.length < CONFIG.queue.baseWhileBelow) spawnTask();
    spawnTimer = CONFIG.queue.baseSpawnEverySec * arrivalFactor() * (0.7 + Math.random() * 0.6);
  }
  // boite presque vide : on ne fait pas attendre le joueur
  if (state.queue.length < CONFIG.queue.refillBelow && spawnTimer > CONFIG.queue.refillSec) {
    spawnTimer = CONFIG.queue.refillSec;
  }
  const over = state.queue.length - CONFIG.queue.capacity;
  if (over > 0) state.stress += over * CONFIG.stress.overflowPerSec * dt;
  else state.stress -= CONFIG.stress.decayPerSec * dt;
  state.stress = clamp(state.stress, 0, CONFIG.stress.max);
}

// Palier suivant du tutoriel : on genere d'un coup toutes les taches necessaires sauf la derniere,
// sans depasser la capacite de la boite (pas de stress). Le joueur n'attend qu'une fois.
export function prefillForNextGoal() {
  const goals = CONFIG.unlocks.filter((u) => !state.flags[u.id] && u.tasks).map((u) => u.tasks);
  if (!goals.length) return;
  const goal = Math.min(...goals), left = goal - state.stats.tasksDone;
  if (left > CONFIG.prefillWithin) return;
  const n = Math.min(left - state.queue.length - 1, CONFIG.queue.capacity - state.queue.length);
  for (let i = 0; i < n; i++) spawnTask();
}

export function initTasks() {
  if (state.queue.length === 0 && state.stats.tasksDone === 0) CONFIG.queue.startTasks.forEach((t) => spawnTask(t));
  prefillForNextGoal();
  addSystem(tick);
}
on("agencyReset", () => { spawnTimer = 0; });
