// Logique de la file de taches (sans interface).
import { CONFIG } from "./config.js";
import { state, earn } from "./state.js";
import { addSystem } from "./loop.js";
import { emit, on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { makeTask, enqueue } from "./taskdata.js";
import { tryAutomate } from "./workflows.js";

let spawnTimer = 0;

export function isUnlocked(type) {
  const c = CONFIG.tasks[type];
  return c.city <= state.city && state.hoursRun >= c.unlockHours;
}
export const availableTypes = () => Object.keys(CONFIG.tasks).filter(isUnlocked);

// Gains du traitement manuel : ameliorations de Nahel.
export const manualMult = () => 1 + state.team.nahel.lvl * CONFIG.team.nahel.manualBonus;

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

// Cree une tache : un workflow la prend ou elle rejoint la file manuelle.
export function spawnTask(type, client = null) {
  const t = makeTask(type || pickType(), client);
  if (tryAutomate(t)) return;
  if (!enqueue(t) && client) emit("taskLost", t);
}

// Retourne les gains, ou null si la tache n'existe plus.
export function completeTask(id) {
  const i = state.queue.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const task = state.queue[i];
  const cfg = CONFIG.tasks[task.type];
  const gain = earn(cfg.euro, cfg.hours, manualMult());
  state.queue.splice(i, 1);
  state.stats.tasksDone++;
  emit("task", { task, auto: false, age: state.stats.playSeconds - task.born });
  return gain;
}

export function mistake() {
  state.stress = clamp(state.stress + CONFIG.stress.mistake, 0, CONFIG.stress.max);
  sfx.error();
}

function checkUnlocks() {
  for (const [k, c] of Object.entries(CONFIG.tasks)) {
    if (!state.unlocked[k] && isUnlocked(k)) {
      state.unlocked[k] = true;
      toast("Nouveau type de tâche : " + c.label);
      sfx.unlock();
    }
  }
}

function tick(dt) {
  checkUnlocks();
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTask();
    spawnTimer = CONFIG.queue.baseSpawnEverySec * (0.7 + Math.random() * 0.6);
  }
  const over = state.queue.length - CONFIG.queue.capacity;
  if (over > 0) state.stress += over * CONFIG.stress.overflowPerSec * dt;
  else state.stress -= CONFIG.stress.decayPerSec * dt;
  state.stress = clamp(state.stress, 0, CONFIG.stress.max);
}

export function initTasks() {
  if (state.queue.length === 0 && state.stats.tasksDone === 0) CONFIG.queue.startTasks.forEach((t) => spawnTask(t));
  addSystem(tick);
}
on("agencyReset", () => { spawnTimer = 0; });
