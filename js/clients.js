// Clients : demandes, signature, abonnements, service rendu, satisfaction, credibilite.
import { CONFIG } from "./config.js";
import { state, earn, gainMult } from "./state.js";
import { addSystem } from "./loop.js";
import { on, emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { clamp } from "./util.js";
import { spawnTask, availableTypes, arrivalFactor } from "./tasks.js";
import { service, payroll, freeStaff, serviceFor } from "./staff.js";
import { DATA } from "./data.js";

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
  let name = free.length && Math.random() < 0.5 ? pick(free) : null;
  for (let k = 0; !name && k < 30; k++) {                         // nom genere : prefixe du secteur + nom de famille
    const cand = `${sec.prefix ? sec.prefix + " " : ""}${pick(DATA.names.noms)}`;
    if (!taken.has(cand)) name = cand;
  }
  if (!name) name = pick(sec.names) + " " + (1 + Math.floor(Math.random() * 9));

  // palier (rang) : ouvre avec l'argent gagne et la credibilite ; les rangs eleves sont favorises par reputation et villes
  const boost = 1 + state.reputation * CONFIG.prestige.repLargeBoost + state.city * 0.4;
  const entries = Object.entries(CONFIG.sizes);
  const avail = entries.filter(([, z]) => state.runMoney >= z.minMoney && state.credibility >= z.minCred);
  const topIdx = Math.max(...avail.map(([k]) => entries.findIndex(([x]) => x === k)));
  const weights = avail.map(([k, z]) => {
    const idx = entries.findIndex(([x]) => x === k);
    const higher = topIdx - idx;                                   // nombre de rangs plus hauts deja disponibles
    return [k, z.weight * Math.pow(CONFIG.higherTierDamp, higher) * (idx >= 2 ? boost : 1)];
  });
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total, size = weights[0][0];
  for (const [k, w] of weights) { if ((r -= w) < 0) { size = k; break; } }
  const sz = CONFIG.sizes[size], N = CONFIG.cityNeedBonus;

  // profil dans le palier : u (0 a 1) place le client dans la plage de temps demande du palier ;
  // plus il demande, plus il rapporte (et plus il est exigeant en competence)
  const [lo, hi] = CONFIG.profileSpread;
  let u = Math.random();
  if (state.stats.clientsSigned === 0) u = Math.min(u, 0.5);     // le tout premier client est facile a servir
  const m = lo + u * (hi - lo);
  let skill = sz.skill[0] + Math.floor(Math.random() * (sz.skill[1] - sz.skill[0] + 1));
  if (m > 1.3) skill += 1; else if (m < 0.8) skill -= 1;
  skill = Math.max(1, Math.min(10, skill + state.city * N.skill));
  const [t0, t1] = sz.timeRange;
  const time = Math.max(2, Math.round((t0 + u * (t1 - t0)) * (1 + state.city * N.time)));
  const pay = +(sz.pay * Math.pow(m, 1.4) * (1 + 0.5 * state.city)).toFixed(2);
  return { id: state.nextClientId++, sector: sid, name, size, pay, every: sz.taskEverySec, types: sec.tasks, need: { time, skill }, profile: +m.toFixed(2) };
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

// Ce qui fait bouger la satisfaction d'un client en ce moment (par seconde) : total + causes lisibles
export function satRate(c) {
  const now = state.stats.playSeconds, sv = service(c), parts = [];
  const dServ = (sv - 0.7) * C.serviceGain;
  parts.push({ v: dServ, txt: sv >= 0.7 ? `service à ${Math.round(sv * 100)} %` : `service insuffisant (${Math.round(sv * 100)} %, il faut 70 %)` });
  if (state.stress >= CONFIG.stress.max - 0.01) parts.push({ v: C.stressMaxPerSec, txt: "stress au maximum" });
  else if (state.stress >= CONFIG.stress.highThreshold) parts.push({ v: C.stressHighPerSec, txt: "stress élevé" });
  const late = state.queue.filter((t) => t.client === c.id && now - t.born > CONFIG.queue.overdueSec).length;
  if (late) parts.push({ v: late * C.overduePerSec, txt: `${late} tâche${late > 1 ? "s" : ""} en retard` });
  return { total: parts.reduce((a, p) => a + p.v, 0), parts };
}

// Arreter un contrat toi-meme : le client part sans proces, mais ta credibilite baisse un peu.
export function terminateClient(id) {
  const c = findClient(id);
  if (!c) return false;
  removeClient(id, false);
  state.credibility = clamp(state.credibility + C.terminateCred, 0, 100);
  sfx.tap();
  toast(`Contrat arrêté avec ${c.name}.`);
  return true;
}

function tick(dt) {
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
      c.nextTask = c.every * arrivalFactor() * (0.75 + Math.random() * 0.5);
    }
    c.sat = clamp(c.sat + satRate(c).total * dt, 0, 100);
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
