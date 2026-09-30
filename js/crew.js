// Equipe : recrutement, ameliorations, Jadd (fenetres), Noah (attaques), chaleur.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { on, emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { bubble } from "./bubbles.js";
import { clamp } from "./util.js";
import { activeTypes, activeCount, wf } from "./workflows.js";
import { deskFx } from "./render.js";

const T = CONFIG.team;
export const member = (id) => state.team[id];
export const isVisible = (id) => id === "nahel" || state.hoursRun >= T[id].unlockHours || state.team[id].on;
export const upgradeCost = (id) => Math.round(T[id].upgrade.base * Math.pow(T[id].upgrade.growth, state.team[id].lvl));

export function recruit(id) {
  const m = state.team[id], cfg = T[id];
  if (m.on || state.money < cfg.recruit) return false;
  state.money -= cfg.recruit; m.on = true;
  sfx.unlock();
  bubble(id, id === "jadd" ? "Enfin. Je vais pouvoir ouvrir des fenêtres." : id === "yanis" ? "C'est parti. On va automatiser tout ça." : "Je m'occupe de la sécurité.");
  return true;
}

export function upgrade(id) {
  const m = state.team[id];
  if (!m.on || m.lvl >= T[id].maxLevel) return false;
  const c = upgradeCost(id);
  if (state.money < c) return false;
  state.money -= c; m.lvl++;
  sfx.ok();
  return true;
}

export function buyServer() {
  const S = CONFIG.servers;
  const cost = serverCost();
  if (state.servers >= S.max || state.money < cost) return false;
  state.money -= cost; state.servers++;
  sfx.unlock();
  return true;
}
export const serverCost = () => Math.round(CONFIG.servers.cost * Math.pow(CONFIG.servers.growth, state.servers));

// ---- effets affiches ----
export const jaddEvery = () => T.jadd.everySec * Math.pow(T.jadd.everyFactor, state.team.jadd.lvl);
export const noahBlock = () => state.team.noah.on ? Math.min(T.noah.blockMax, T.noah.blockBase + T.noah.blockPerLevel * state.team.noah.lvl) : 0;

export function jaddTap() {
  const lines = CONFIG.jaddLines;
  bubble("jadd", lines[Math.floor(Math.random() * lines.length)]);
  sfx.tap();
}

// ---- Jadd ouvre la fenetre ----
let winClock = 0, winT = -1, nextWindow = T.jadd.everySec;
function openWindow() {
  winT = 0;
  state.stats.windowsOpened++;
  const j = state.team.jadd;
  state.heat = clamp(state.heat - T.jadd.heatDrop - j.lvl * 2, 0, 100);
  state.stress = clamp(state.stress - T.jadd.stressDrop, 0, 100);
  sfx.ok();
  bubble("jadd", ["J'ouvre la fenêtre.", "Un peu d'air, et ça repart.", "Ça sent le serveur chaud ici."][state.stats.windowsOpened % 3], 3200);
}

// ---- Attaques ----
let nextAttack = CONFIG.attacks.everySec * 0.6;
export function hitAttack() {
  const a = state.attack;
  if (!a) return;
  a.hp--;
  if (a.hp <= 0) {
    state.attack = null;
    state.stats.attacksRepelled++;
    sfx.ok();
    toast("Attaque repoussée.");
  } else sfx.tap();
}

function attackTick() {
  const A = CONFIG.attacks, now = state.stats.playSeconds;
  if (state.attack) {
    if (now >= state.attack.deadline) {
      const t = state.attack.type;
      wf(t).pausedUntil = now + A.pauseSec;
      state.attack = null;
      sfx.error();
      toast(`Attaque réussie : le workflow « ${CONFIG.tasks[t].label} » est en pause.`);
    }
    return;
  }
  if (state.hoursRun < A.startHours || now < nextAttack) return;
  const targets = activeTypes();
  if (!targets.length) return;
  nextAttack = now + A.everySec * (0.7 + Math.random() * 0.6);
  const type = targets[Math.floor(Math.random() * targets.length)];
  if (Math.random() < noahBlock()) {
    state.stats.attacksRepelled++;
    bubble("noah", `Attaque bloquée sur « ${CONFIG.tasks[type].label} ».`);
    sfx.ok();
  } else {
    state.attack = { type, hp: A.tapsToRepel, deadline: now + A.windowSec };
    sfx.alert();
  }
}

function tick(dt) {
  // chaleur
  const H = CONFIG.heat, j = state.team.jadd;
  let target = H.perWorkflow * activeCount() + H.perServer * state.servers - (j.on ? H.jaddPassivePerLevel * j.lvl : 0);
  target = clamp(target, 0, H.max);
  state.heat = clamp(state.heat + (target - state.heat) * Math.min(1, H.approachPerSec * dt), 0, H.max);

  // fenetre de Jadd
  if (j.on) {
    winClock += dt;
    if (winClock >= nextWindow) { winClock = 0; nextWindow = jaddEvery(); openWindow(); }
  }
  if (winT >= 0) {
    winT += dt;
    const d = 3.2, x = winT / d;
    deskFx.windowOpen = x >= 1 ? 0 : Math.min(1, Math.min(x, 1 - x) * 4);
    if (x >= 1) winT = -1;
  }
  attackTick();
}

on("agencyReset", () => { winClock = 0; nextWindow = jaddEvery(); nextAttack = CONFIG.attacks.everySec * 0.6 + state.stats.playSeconds; winT = -1; deskFx.windowOpen = 0; });

export function initCrew() {
  nextWindow = jaddEvery();
  nextAttack = state.stats.playSeconds + CONFIG.attacks.everySec * 0.6;
  addSystem(tick);
}
