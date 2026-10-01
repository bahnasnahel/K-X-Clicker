// Direction : recrutement, ameliorations, Jadd (fenetre et evenements). Noah agit dans security.js.
import { CONFIG } from "./config.js";
import { state, shopDiscount } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { bubble } from "./bubbles.js";
import { clamp } from "./util.js";
import { activeTypes, auto } from "./workflows.js";
import { spawnTask } from "./tasks.js";
import { makeOffer, incomePerSec } from "./clients.js";
import { deskFx } from "./render.js";

const T = CONFIG.team;
export const member = (id) => state.team[id];
export const isVisible = (id) => id === "nahel" || !!state.flags["dir_" + id] || (id === "noah" && !!state.flags.security) || state.team[id].on;
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
// effet des bons evenements : +10 % par niveau apres le niveau 10, et x2 tous les 5 niveaux
export const goodEffectMult = () => {
  const J = T.jadd, l = state.team.jadd.lvl;
  return (1 + J.goodAfterPerLevel * Math.max(0, l - J.goodAfter)) * Math.pow(2, Math.floor(l / J.goodDoubleEvery));
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

function applyEffect(e, k = 1) {      // k : multiplicateur des bons evenements (Jadd)
  const now = state.stats.playSeconds;
  if (e.money) {
    const v = (e.money + (e.moneyPerIncome || 0) * incomePerSec()) * k;
    state.money = Math.max(0, state.money + v);
    if (v > 0) state.stats.moneyEarned += v;
  }
  if (e.stress) state.stress = clamp(state.stress + e.stress * k, 0, CONFIG.stress.max);
  if (e.cred) state.credibility = clamp(state.credibility + e.cred * k, 0, 100);
  if (e.hours) state.hoursSaved += e.hours * k;
  if (e.tasks) for (let i = 0; i < e.tasks; i++) spawnTask();
  if (e.offer) for (let i = 0, n = Math.max(1, Math.round(e.offer * k)); i < n && state.offers.length < CONFIG.ads.client.maxPending + 1; i++) state.offers.push(makeOffer());
  if (e.pause) { const t = activeTypes(); if (t.length) auto(t[Math.floor(Math.random() * t.length)]).pausedUntil = now + e.pause; }
}

function openWindow() {
  state.stats.windowsOpened++;
  const good = Math.random() < goodChance();
  const list = CONFIG.jaddEvents[good ? "good" : "bad"].filter((e) => !(e.effect.pause && !activeTypes().length));
  const ev = list[Math.floor(Math.random() * list.length)];
  applyEffect(ev.effect, good ? goodEffectMult() : 1);
  winT = 0;
  sfx[good ? "coin" : "error"]();
  bubble("jadd", `<i class="${good ? "good" : "bad"}">${good ? "Bonne surprise" : "Mauvaise surprise"}</i> ${ev.text}`, 6500);
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
}

on("agencyReset", () => { winT = -1; pass = null; deskFx.windowOpen = 0; deskFx.passer = null; });

export function initCrew() {
  eventIn = nextEventIn();
  addSystem(tick);
}
