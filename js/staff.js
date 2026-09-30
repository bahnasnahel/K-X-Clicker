// Personnel : Nahel + employes (data/employees.json). Temps, competence, affectation aux clients, salaires.
import { CONFIG } from "./config.js";
import { state, staffCap, office } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { DATA } from "./data.js";

const S = CONFIG.staff;
const O = CONFIG.office;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Nahel travaille aussi : ses ameliorations lui donnent du temps et de la competence.
export function nahelStat() {
  const lvl = state.team.nahel.lvl;
  return { id: "nahel", name: "Nahel", title: "Toi", time: S.nahel.baseTime + lvl * S.nahel.timePerLevel, skill: 1 + Math.floor(lvl / S.nahel.skillEvery), salary: 0, tier: 0, isNahel: true };
}

export function staffList() {
  const out = [nahelStat()];
  for (const id of state.staff) { const e = DATA.byId[id]; if (e) out.push({ ...e, title: e.titre }); }
  return out;
}
export const findStaff = (id) => staffList().find((p) => p.id === id);
export const payroll = () => state.staff.reduce((s, id) => s + (DATA.byId[id] ? DATA.byId[id].salary : 0), 0);
export const maxStaff = () => staffCap();

// ---- service rendu a un client ----
export const assignedTo = (clientId) => staffList().filter((p) => state.assign[p.id] === clientId);
export function timeGiven(c) { return assignedTo(c.id).reduce((s, p) => s + p.time, 0); }
export function skillGiven(c) { return assignedTo(c.id).reduce((m, p) => Math.max(m, p.skill), 0); }

// 0 a 1 : temps fourni / temps demande, reduit si le niveau de competence est trop bas
export function serviceFor(need, time, skill) {
  const cover = Math.min(1, time / need.time);
  const f = skill >= need.skill ? 1 : Math.pow(skill / need.skill, 2);
  return cover * f;
}
export const service = (c) => serviceFor(c.need, timeGiven(c), skillGiven(c));

export function freeStaff() { return staffList().filter((p) => !state.assign[p.id]); }

// ---- affectation ----
export function assign(staffId, clientId) {
  if (clientId == null || state.assign[staffId] === clientId) delete state.assign[staffId];
  else state.assign[staffId] = clientId;
  state.autoAssign = false;
}

export function autoAssign() {
  state.assign = {};
  const free = staffList();
  const clients = [...state.clients].sort((a, b) => b.pay - a.pay);
  for (const c of clients) {
    let given = 0;
    while (given < c.need.time && free.length) {
      // le moins qualifie suffisant, sinon le plus qualifie disponible
      const able = free.filter((p) => p.skill >= c.need.skill).sort((a, b) => a.skill - b.skill);
      const p = able.length ? able[0] : free.sort((a, b) => b.skill - a.skill)[0];
      free.splice(free.indexOf(p), 1);
      state.assign[p.id] = c.id;
      given += p.time;
    }
  }
  // les personnes restantes renforcent le client le moins bien servi
  for (const p of free) {
    const worst = [...state.clients].sort((a, b) => service(a) - service(b))[0];
    if (worst && service(worst) < 1) state.assign[p.id] = worst.id;
  }
}
export const refreshAssign = () => { if (state.autoAssign) autoAssign(); };

// ---- embauche : les profils viennent des campagnes de recrutement ----
export const isHired = (id) => state.staff.includes(id);
export const candidates = () => state.candidates.map((id) => DATA.byId[id]).filter(Boolean);

export function hire(id) {
  const e = DATA.byId[id];
  if (!e || isHired(id) || !state.candidates.includes(id) || state.money < e.hire || state.staff.length >= maxStaff()) return false;
  state.money -= e.hire;
  state.staff.push(id);
  state.candidates = state.candidates.filter((x) => x !== id);
  refreshAssign();
  sfx.unlock();
  toast(`${e.name} rejoint K'X : ${e.titre}.`);
  return true;
}

export function fire(id) {
  state.staff = state.staff.filter((x) => x !== id);
  delete state.assign[id];
  refreshAssign();
  sfx.tap();
}

// ---- bureau : plus de places, et le dessin change ----
export const officeMax = () => state.office >= O.levels.length - 1;
export const nextOffice = () => (officeMax() ? null : O.levels[state.office + 1]);
export const officeCost = () => (officeMax() ? 0 : Math.round(O.levels[state.office + 1].cost * (1 + O.cityCostBonus * state.city)));
export function upgradeOffice() {
  if (officeMax() || state.money < officeCost()) return false;
  state.money -= officeCost();
  state.office++;
  sfx.unlock();
  toast(`Nouveau bureau : ${office().name}. ${office().staff} places.`);
  return true;
}

// ---- salaires (en continu) ----
let clean = 0;
function tick(dt) {
  const pay = payroll();
  if (pay > 0) state.money = Math.max(0, state.money - pay * dt);
  clean += dt;
  if (clean >= 2) {                       // nettoie les affectations orphelines
    clean = 0;
    const ids = new Set(staffList().map((p) => p.id)), cl = new Set(state.clients.map((c) => c.id));
    for (const [sid, cid] of Object.entries(state.assign)) if (!ids.has(sid) || !cl.has(cid)) delete state.assign[sid];
  }
}

on("resign", refreshAssign);
on("clientSigned", refreshAssign);
on("agencyReset", () => { clean = 0; });
export function initStaff() { addSystem(tick); }
