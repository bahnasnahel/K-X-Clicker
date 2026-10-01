// Direction : recrutement, ameliorations, Jadd (fenetre et evenements), Noah (attaques).
import { CONFIG } from "./config.js";
import { state, shopDiscount } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { bubble } from "./bubbles.js";
import { clamp } from "./util.js";
import { activeTypes, auto } from "./workflows.js";
import { spawnTask } from "./tasks.js";
import { makeOffer, incomePerSec } from "./clients.js";
import { deskFx } from "./render.js";

const T = CONFIG.team;
export const member = (id) => state.team[id];
export const isVisible = (id) => id === "nahel" || !!state.flags["dir_" + id] || state.team[id].on;
export const upgradeCost = (id) => Math.round(T[id].upgrade.base * Math.pow(T[id].upgrade.growth, state.team[id].lvl) * shopDiscount("officeDiscount"));

export function recruit(id) {
  const m = state.team[id], cfg = T[id];
  if (m.on || state.money < cfg.recruit) return false;
  state.money -= cfg.recruit; m.on = true;
  m.lvl = Math.max(m.lvl, state.shop.startDir || 0);                // boutique : direction aguerrie
  sfx.unlock();
  bubble(id, id === "jadd" ? "Enfin. Je guette la fenêtre." : id === "yanis" ? "C'est parti. On va automatiser tout ça." : "Je m'occupe de la sécurité.");
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

// ---- effets affiches ----
export const goodChance = () => Math.min(T.jadd.goodMax, T.jadd.goodBase + T.jadd.goodPerLevel * state.team.jadd.lvl);

// ---- Attaques : la puissance monte avec la progression ; la defense de Noah l'affronte ----
export const attackPower = () => Math.min(CONFIG.attacks.powerMax, 1 + Math.floor(state.hoursRun / CONFIG.attacks.powerEveryHours) + state.city);
export const noahDefense = () => (state.team.noah.on ? T.noah.defenseBase + T.noah.defensePerLevel * state.team.noah.lvl : 0);
export const blockChance = (p = attackPower()) => { const d = noahDefense(); return d ? d / (d + p) : 0; };
export const noahBlock = () => blockChance();
const tapsFor = (p) => {
  const N = T.noah, A = CONFIG.attacks;
  const red = state.team.noah.on ? Math.max(N.tapReduceMin, 1 - N.tapReducePerLevel * state.team.noah.lvl) : 1;
  return Math.max(2, Math.round((A.tapsBase + A.tapsPerPower * (p - 1)) * red));
};

export function jaddTap() {
  const lines = CONFIG.jaddLines;
  bubble("jadd", lines[Math.floor(Math.random() * lines.length)]);
  sfx.tap();
}

// ---- Jadd : quelque chose passe devant la fenetre, il l'ouvre, un evenement arrive ----
const J = T.jadd;
const PASS_SEC = 5, OPEN_AT = 0.45, OPEN_SEC = 3;
let eventIn = 0, pass = null, winT = -1;
const nextEventIn = () => J.eventEverySec[0] + Math.random() * (J.eventEverySec[1] - J.eventEverySec[0]);

function applyEffect(e) {
  const now = state.stats.playSeconds;
  if (e.money) {
    const v = e.money + (e.moneyPerIncome || 0) * incomePerSec();
    state.money = Math.max(0, state.money + v);
    if (v > 0) state.stats.moneyEarned += v;
  }
  if (e.stress) state.stress = clamp(state.stress + e.stress, 0, CONFIG.stress.max);
  if (e.cred) state.credibility = clamp(state.credibility + e.cred, 0, 100);
  if (e.hours) state.hoursSaved += e.hours;
  if (e.tasks) for (let i = 0; i < e.tasks; i++) spawnTask();
  if (e.offer && state.offers.length < CONFIG.ads.client.maxPending + 1) state.offers.push(makeOffer());
  if (e.pause) { const t = activeTypes(); if (t.length) auto(t[Math.floor(Math.random() * t.length)]).pausedUntil = now + e.pause; }
}

function openWindow() {
  state.stats.windowsOpened++;
  const good = Math.random() < goodChance();
  const list = CONFIG.jaddEvents[good ? "good" : "bad"].filter((e) => !(e.effect.pause && !activeTypes().length));
  const ev = list[Math.floor(Math.random() * list.length)];
  applyEffect(ev.effect);
  winT = 0;
  sfx[good ? "coin" : "error"]();
  bubble("jadd", `<i class="${good ? "good" : "bad"}">${good ? "Bonne surprise" : "Mauvaise surprise"}</i> ${ev.text}`, 6500);
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
    if (state.team.noah.on) bubble("noah", "Bien joué. On les a repoussés ensemble.");
    else toast("Attaque repoussée.");
  } else sfx.tap();
}

function attackTick() {
  const A = CONFIG.attacks, now = state.stats.playSeconds;
  if (state.attack) {
    if (now >= state.attack.deadline) {
      const t = state.attack.type, p = state.attack.power || 1;
      auto(t).pausedUntil = now + A.pauseSec;
      const stolen = Math.round(state.money * Math.min(0.4, A.theftPct * p));
      state.money -= stolen;
      state.attack = null;
      sfx.error();
      toast(`Attaque réussie : « ${CONFIG.tasks[t].label} » est en pause${stolen ? `, ${stolen} EUR volés` : ""}.`);
      if (state.team.noah.on) bubble("noah", "Celle-là était trop forte. Monte-moi de niveau.");
    }
    return;
  }
  if (state.stats.autoDone < A.startAutoDone || now < nextAttack) return;
  const targets = activeTypes();
  if (!targets.length) return;
  const p = attackPower();
  nextAttack = now + (A.everySec / (1 + A.frequencyPerPower * p)) * (0.7 + Math.random() * 0.6);
  const type = targets[Math.floor(Math.random() * targets.length)];
  if (Math.random() < blockChance(p)) {
    state.stats.attacksRepelled++;
    bubble("noah", `Attaque de puissance ${p} bloquée sur « ${CONFIG.tasks[type].label} ».`);
    sfx.ok();
  } else {
    state.attack = { type, power: p, hp: tapsFor(p), deadline: now + A.windowSec };
    sfx.alert();
  }
}

function tick(dt) {
  // Jadd
  if (state.team.jadd.on) {
    if (!pass) {
      eventIn -= dt;
      if (eventIn <= 0) { pass = { kind: CONFIG.jaddEvents.passers[Math.floor(Math.random() * CONFIG.jaddEvents.passers.length)], t: 0, done: false }; }
    } else {
      pass.t += dt;
      const p = pass.t / PASS_SEC;
      if (!pass.done && p >= OPEN_AT) { pass.done = true; openWindow(); }
      deskFx.passer = { kind: pass.kind, p: Math.min(1, p) };
      if (p >= 1) { pass = null; deskFx.passer = null; eventIn = nextEventIn(); }
    }
  } else { pass = null; deskFx.passer = null; }
  if (winT >= 0) {
    winT += dt;
    const x = winT / OPEN_SEC;
    deskFx.windowOpen = x >= 1 ? 0 : Math.min(1, Math.min(x, 1 - x) * 4);
    if (x >= 1) winT = -1;
  }
  attackTick();
}

on("agencyReset", () => { nextAttack = CONFIG.attacks.everySec * 0.6 + state.stats.playSeconds; winT = -1; pass = null; deskFx.windowOpen = 0; deskFx.passer = null; });

export function initCrew() {
  eventIn = nextEventIn();
  nextAttack = state.stats.playSeconds + CONFIG.attacks.everySec * 0.6;
  addSystem(tick);
}
