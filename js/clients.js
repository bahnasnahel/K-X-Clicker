// Clients : demandes, signature, abonnements, service rendu, satisfaction, credibilite.
import { CONFIG } from "./config.js";
import { state, earn, gainMult } from "./state.js";
import { addSystem } from "./loop.js";
import { on, emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { spawnTask, availableTypes } from "./tasks.js";
import { service, payroll, freeStaff, serviceFor } from "./staff.js";

const C = CONFIG.clients, K = CONFIG.credibility;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const payFactor = (sat) => (sat >= C.payFullAbove ? 1 : sat / C.payFullAbove);
export const clientIncome = (c) => c.pay * payFactor(c.sat) * (0.5 + 0.5 * service(c)) * gainMult();
export const incomePerSec = () => state.clients.reduce((s, c) => s + clientIncome(c), 0);
export const findClient = (id) => state.clients.find((c) => c.id === id);

// a quoi ressemblerait le service si on signait ce client avec le personnel libre
export function previewService(o) {
  const free = freeStaff();
  const time = free.reduce((s, p) => s + p.time, 0), skill = free.reduce((m, p) => Math.max(m, p.skill), 0);
  return serviceFor(o.need, time, skill);
}

export function makeOffer() {
  const sectors = Object.entries(CONFIG.sectors).filter(([, s]) => s.city <= state.city && state.runMoney >= s.minMoney);
  const [sid, sec] = pick(sectors);
  const taken = new Set([...state.clients, ...state.offers].map((x) => x.name));
  const free = sec.names.filter((n) => !taken.has(n));
  const name = free.length ? pick(free) : pick(sec.names) + " " + (1 + Math.floor(Math.random() * 9));
  // taille : les gros clients arrivent avec l'argent, la reputation et les villes
  const boost = 1 + state.reputation * CONFIG.prestige.repLargeBoost + state.city * 0.4;
  const weights = Object.entries(CONFIG.sizes).map(([k, s]) => {
    if (state.runMoney < s.minMoney) return [k, 0];
    if (k === "gros" && state.credibility < K.noBigBelow) return [k, 0];
    return [k, k === "petit" ? 1 : k === "moyen" ? 0.8 : 0.35 * boost];
  });
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total, size = "petit";
  for (const [k, w] of weights) { if ((r -= w) < 0) { size = k; break; } }
  const sz = CONFIG.sizes[size], N = CONFIG.cityNeedBonus;
  const skill = sz.skill[0] + Math.floor(Math.random() * (sz.skill[1] - sz.skill[0] + 1)) + state.city * N.skill;
  const time = Math.round(sz.time * (1 + state.city * N.time) * (0.9 + Math.random() * 0.2));
  const pay = +(sz.pay * (1 + 0.5 * state.city) * (0.85 + Math.random() * 0.3)).toFixed(2);
  return { id: state.nextClientId++, sector: sid, name, size, pay, every: sz.taskEverySec, types: sec.tasks, need: { time, skill } };
}

export function signOffer(id) {
  const i = state.offers.findIndex((o) => o.id === id);
  if (i < 0) return false;
  const [o] = state.offers.splice(i, 1);
  state.clients.push({ ...o, sat: C.startSatisfaction, nextTask: o.every * Math.random(), happy: false });
  state.stats.clientsSigned++;
  emit("clientSigned", o);
  sfx.unlock();
  toast(`Nouveau client : ${o.name}`);
  return true;
}

export function dropOffer(id) { state.offers = state.offers.filter((o) => o.id !== id); }

export function removeClient(id, resigned) {
  const i = state.clients.findIndex((c) => c.id === id);
  if (i < 0) return;
  const [c] = state.clients.splice(i, 1);
  if (resigned) emit("resign", c);
}

function tick(dt) {
  const now = state.stats.playSeconds;
  const types = availableTypes();
  let sumService = 0;
  for (let i = state.clients.length - 1; i >= 0; i--) {
    const c = state.clients[i];
    const sv = service(c);
    sumService += sv;
    c.nextTask -= dt;
    if (c.nextTask <= 0) {
      const ok = c.types.filter((t) => types.includes(t));
      if (ok.length) spawnTask(pick(ok), c.id, c.need.skill);
      c.nextTask = c.every * (0.75 + Math.random() * 0.5);
    }
    let d = (sv - 0.7) * C.serviceGain;
    if (state.stress >= CONFIG.stress.max - 0.01) d += C.stressMaxPerSec;
    else if (state.stress >= CONFIG.stress.highThreshold) d += C.stressHighPerSec;
    for (const t of state.queue) if (t.client === c.id && now - t.born > CONFIG.queue.overdueSec) d += C.overduePerSec;
    c.sat = clamp(c.sat + d * dt, 0, 100);
    earn(c.pay * payFactor(c.sat) * (0.5 + 0.5 * sv) * dt, 0);
    if (!c.happy && c.sat >= C.satisfied) { c.happy = true; state.stats.clientsSatisfied++; }
    if (c.sat <= 0) {
      sfx.error();
      toast(`${c.name} a résilié son abonnement.`);
      removeClient(c.id, true);
    }
  }

  // credibilite : bien servir la fait monter, mal servir la fait baisser
  let d = 0;
  if (state.clients.length) {
    const avg = sumService / state.clients.length;
    if (avg < K.serviceLow) d += (K.serviceLow - avg) * K.lowPerSec;
    else if (avg >= K.serviceHigh) d += K.highPerSec;
  }
  if (state.money <= 0 && payroll() > 0) d += K.unpaidPerSec;
  state.credibility = clamp(state.credibility + d * dt, 0, 100);
}

function bump(id, v) { const c = findClient(id); if (c) c.sat = clamp(c.sat + v, 0, 100); }

on("task", ({ task, auto, age }) => {
  if (task.client == null) return;
  if (auto) bump(task.client, C.onAuto);
  else bump(task.client, age <= C.fastSec ? C.onManualFast : C.onManualSlow);
});
on("bug", ({ client }) => { if (client != null) bump(client, C.onBug); });
on("taskLost", (t) => bump(t.client, -1));
on("resign", () => { state.credibility = clamp(state.credibility + K.onResign, 0, 100); });

export function initClients() { addSystem(tick); }
