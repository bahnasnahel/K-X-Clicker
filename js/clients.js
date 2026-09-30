// Clients : demandes, signature, abonnements, satisfaction.
import { CONFIG } from "./config.js";
import { state, earn, gainMult } from "./state.js";
import { addSystem } from "./loop.js";
import { on, emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { spawnTask, availableTypes } from "./tasks.js";

const C = CONFIG.clients;
let offerIn = C.startOfferInSec;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const maxClients = () => C.maxClients[Math.min(state.city, C.maxClients.length - 1)];
export const payFactor = (sat) => (sat >= C.payFullAbove ? 1 : sat / C.payFullAbove);
export const clientIncome = (c) => c.pay * payFactor(c.sat) * gainMult();
export const incomePerSec = () => state.clients.reduce((s, c) => s + clientIncome(c), 0);
export const findClient = (id) => state.clients.find((c) => c.id === id);

function offerInterval() {
  return C.offerEverySec * Math.pow(C.offerRepFactor, state.reputation) * (0.8 + Math.random() * 0.4);
}

function makeOffer() {
  const sectors = Object.entries(CONFIG.sectors).filter(([, s]) => s.city <= state.city && state.hoursRun >= s.minHours);
  const [sid, sec] = pick(sectors);
  const taken = new Set([...state.clients, ...state.offers].map((x) => x.name));
  const free = sec.names.filter((n) => !taken.has(n));
  const name = free.length ? pick(free) : pick(sec.names) + " " + (1 + Math.floor(Math.random() * 9));
  // taille : les gros clients arrivent avec les heures, la reputation et les villes
  const boost = 1 + state.reputation * CONFIG.prestige.repLargeBoost + state.city * 0.4;
  const weights = Object.entries(CONFIG.sizes).map(([k, s]) => [k, state.hoursRun >= s.minHours ? (k === "petit" ? 1 : k === "moyen" ? 0.8 : 0.35 * boost) : 0]);
  let total = weights.reduce((s, [, w]) => s + w, 0), r = Math.random() * total, size = "petit";
  for (const [k, w] of weights) { if ((r -= w) < 0) { size = k; break; } }
  const sz = CONFIG.sizes[size];
  const pay = +(sz.pay * (1 + 0.5 * state.city) * (0.85 + Math.random() * 0.3)).toFixed(2);
  return { id: state.nextClientId++, sector: sid, name, size, pay, every: sz.taskEverySec, types: sec.tasks };
}

export function signOffer(id) {
  const i = state.offers.findIndex((o) => o.id === id);
  if (i < 0) return false;
  if (state.clients.length >= maxClients()) { toast("Agence pleine : tous les postes de clients sont occupés."); sfx.error(); return false; }
  const [o] = state.offers.splice(i, 1);
  state.clients.push({ ...o, sat: C.startSatisfaction, nextTask: o.every * Math.random(), happy: false });
  state.stats.clientsSigned++;
  sfx.unlock();
  toast(`Nouveau client : ${o.name}`);
  return true;
}

export function dropOffer(id) { state.offers = state.offers.filter((o) => o.id !== id); }

function tick(dt) {
  // nouvelles demandes
  if (state.offers.length < C.maxOffers) {
    offerIn -= dt;
    if (offerIn <= 0) { state.offers.push(makeOffer()); offerIn = offerInterval(); sfx.tap(); }
  }
  // client par client
  const now = state.stats.playSeconds;
  const types = availableTypes();
  for (let i = state.clients.length - 1; i >= 0; i--) {
    const c = state.clients[i];
    c.nextTask -= dt;
    if (c.nextTask <= 0) {
      const ok = c.types.filter((t) => types.includes(t));
      if (ok.length) spawnTask(pick(ok), c.id);
      c.nextTask = c.every * (0.75 + Math.random() * 0.5);
    }
    let d = 0;
    if (state.stress >= CONFIG.stress.max - 0.01) d += C.stressMaxPerSec;
    else if (state.stress >= CONFIG.stress.highThreshold) d += C.stressHighPerSec;
    for (const t of state.queue) if (t.client === c.id && now - t.born > CONFIG.queue.overdueSec) d += C.overduePerSec;
    if (d === 0) d = C.recoverPerSec;
    c.sat = clamp(c.sat + d * dt, 0, 100);
    earn(c.pay * payFactor(c.sat) * dt, 0);
    if (!c.happy && c.sat >= C.satisfied) { c.happy = true; state.stats.clientsSatisfied++; }
    if (c.sat <= 0) {
      state.clients.splice(i, 1);
      sfx.error();
      toast(`${c.name} a résilié son abonnement.`);
      emit("resign", c);
    }
  }
}

function bump(id, v) { const c = findClient(id); if (c) c.sat = clamp(c.sat + v, 0, 100); }

on("task", ({ task, auto, age }) => {
  if (task.client == null) return;
  if (auto) bump(task.client, C.onAuto);
  else bump(task.client, age <= C.fastSec ? C.onManualFast : C.onManualSlow);
});
on("bug", ({ client }) => { if (client != null) bump(client, C.onBug); });
on("taskLost", (t) => bump(t.client, -1));
on("agencyReset", () => { offerIn = C.startOfferInSec; });

export function initClients() { addSystem(tick); }
