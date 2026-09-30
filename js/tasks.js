// Logique de la file de taches (sans interface).
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";

let spawnTimer = 0;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Multiplicateur de gains du traitement manuel (ameliorations de Nahel, etape 6).
export function manualMult() { return 1; }

function makeData(type) {
  const C = CONFIG.content;
  switch (type) {
    case "facture": return { ...pick(C.factures) };
    case "relance": return { ...pick(C.relances) };
    case "excel": {
      const cells = [];
      while (cells.length < 3) { const c = Math.floor(Math.random() * 9); if (!cells.includes(c)) cells.push(c); }
      return { title: pick(C.excels), cells };
    }
    case "rapport": return { title: pick(C.rapports) };
  }
}

export function spawnTask(type) {
  if (!type) {
    const types = Object.keys(CONFIG.tasks).filter((k) => state.unlocked[k]);
    let total = 0; types.forEach((k) => (total += CONFIG.tasks[k].weight));
    let r = Math.random() * total;
    type = types.find((k) => (r -= CONFIG.tasks[k].weight) < 0) || types[0];
  }
  state.queue.push({ id: state.nextTaskId++, type, data: makeData(type) });
}

// Retourne les gains, ou null si la tache n'existe plus.
export function completeTask(id) {
  const i = state.queue.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const cfg = CONFIG.tasks[state.queue[i].type];
  const m = manualMult();
  const gain = { euro: cfg.euro * m, hours: cfg.hours * m };
  state.queue.splice(i, 1);
  state.money += gain.euro;
  state.hoursSaved += gain.hours;
  state.lifetimeHours += gain.hours;
  state.stats.tasksDone++;
  return gain;
}

export function mistake() {
  state.stress = clamp(state.stress + CONFIG.stress.mistake, 0, CONFIG.stress.max);
  sfx.error();
}

function checkUnlocks() {
  for (const [k, c] of Object.entries(CONFIG.tasks)) {
    if (!state.unlocked[k] && state.hoursSaved >= c.unlockHours) {
      state.unlocked[k] = true;
      toast("Nouveau type de tâche : " + c.label);
      sfx.unlock();
    }
  }
}

function tick(dt) {
  checkUnlocks();

  spawnTimer -= dt;
  const hard = CONFIG.queue.capacity * CONFIG.queue.hardCapMult;
  if (spawnTimer <= 0) {
    if (state.queue.length < hard) spawnTask();
    spawnTimer = CONFIG.queue.spawnEverySec * (0.7 + Math.random() * 0.6);
  }

  const over = state.queue.length - CONFIG.queue.capacity;
  if (over > 0) state.stress += over * CONFIG.stress.overflowPerSec * dt;
  else state.stress -= CONFIG.stress.decayPerSec * dt;
  state.stress = clamp(state.stress, 0, CONFIG.stress.max);
}

export function initTasks() {
  if (state.queue.length === 0) CONFIG.queue.startTasks.forEach((t) => spawnTask(t));
  addSystem(tick);
}
