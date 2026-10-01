// Personnel : Nahel + employes (data/employees.json). Temps, competence, affectation aux clients, salaires.
import { CONFIG } from "./config.js";
import { state, staffCap, office } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { DATA, getEmp } from "./data.js";

const S = CONFIG.staff;
const O = CONFIG.office;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Les dirigeants travaillent aussi chez les clients : leurs niveaux augmentent leur temps et leur competence.
export function directorStat(id) {
  const w = S[id], lvl = state.team[id].lvl, cfg = CONFIG.team[id];
  return {
    id, name: cfg.name, prenom: cfg.name.split(" ")[0], title: id === "nahel" ? "Toi" : cfg.role,
    time: w.baseTime + lvl * w.timePerLevel, skill: w.skillBase + Math.floor(lvl / w.skillEvery),
    salary: 0, tier: 0, isDirector: true, isNahel: id === "nahel",
  };
}
export const nahelStat = () => directorStat("nahel");

export function staffList() {
  const out = [directorStat("nahel")];
  for (const id of ["yanis", "jadd", "noah"]) if (state.team[id].on) out.push(directorStat(id));
  for (const id of state.staff) { const e = getEmp(id); if (e) out.push({ ...e, title: e.titre }); }
  return out;
}
export const findStaff = (id) => staffList().find((p) => p.id === id);
export const payroll = () => state.staff.reduce((s, id) => s + (getEmp(id) ? getEmp(id).salary : 0), 0);
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

// ---- Affectation automatique : vrai algorithme d'optimisation ----
// Objectif : un maximum de clients PLEINEMENT servis (temps couvert + competence suffisante), puis le meilleur
// service pondere par le paiement, en gaspillant le moins de temps possible. Recherche locale (recuit simule)
// a partir de plusieurs solutions de depart, avec un tirage deterministe : le resultat ne "saute" pas.
function evaluate(a, P, C, w) {
  const t = new Array(C.length).fill(0), k = new Array(C.length).fill(0);
  for (let i = 0; i < P.length; i++) {
    const c = a[i];
    if (c >= 0) { t[c] += P[i].time; if (P[i].skill > k[c]) k[c] = P[i].skill; }
  }
  let full = 0, wsum = 0, ssum = 0, waste = 0;
  for (let c = 0; c < C.length; c++) {
    const sv = serviceFor(C[c].need, t[c], k[c]);
    if (sv >= 0.999) full++;
    wsum += w[c] * Math.min(1, sv); ssum += sv;
    waste += Math.max(0, t[c] - C[c].need.time);
  }
  return full * 1000 + wsum * 100 + ssum * 10 - waste * 0.01;
}

function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// solution de depart : clients du plus facile au plus dur (maximise le nombre de clients servis)
function greedy(P, C, order) {
  const a = new Array(P.length).fill(-1);
  for (const c of order) {
    let time = 0;
    const need = C[c].need;
    const free = () => P.map((_, i) => i).filter((i) => a[i] < 0);
    const ok = free().filter((i) => P[i].skill >= need.skill).sort((x, y) => P[x].time - P[y].time);
    const first = ok.length ? ok[0] : free().sort((x, y) => P[y].skill - P[x].skill)[0];
    if (first == null) break;
    a[first] = c; time += P[first].time;
    while (time < need.time) {
      const f = free(); if (!f.length) break;
      const fits = f.filter((i) => P[i].time >= need.time - time).sort((x, y) => P[x].time - P[y].time);
      const pick = fits.length ? fits[0] : f.sort((x, y) => P[y].time - P[x].time)[0];
      a[pick] = c; time += P[pick].time;
    }
  }
  return a;
}

export function optimizeAssignment(P, C, seed = 1) {
  if (!P.length || !C.length) return new Array(P.length).fill(-1);
  const avg = C.reduce((s, c) => s + c.pay, 0) / C.length || 1;
  const w = C.map((c) => c.pay / avg);
  const idx = C.map((_, i) => i);
  const starts = [
    greedy(P, C, [...idx].sort((x, y) => C[x].need.time - C[y].need.time)),
    greedy(P, C, [...idx].sort((x, y) => C[y].pay - C[x].pay)),
    new Array(P.length).fill(-1),
  ];
  const rnd = mulberry(seed);
  let best = null, bestScore = -Infinity;
  const iters = 2500;
  for (const st of starts) {
    let cur = st.slice(), curScore = evaluate(cur, P, C, w);
    if (curScore > bestScore) { bestScore = curScore; best = cur.slice(); }
    for (let it = 0; it < iters; it++) {
      const temp = 40 * (1 - it / iters) + 0.01;
      const i = Math.floor(rnd() * P.length), old = cur[i];
      let j = -1, oldJ = 0;
      if (rnd() < 0.7) {                                   // deplacer une personne (ou la liberer)
        const t = Math.floor(rnd() * (C.length + 1)) - 1;
        if (t === old) continue;
        cur[i] = t;
      } else {                                              // echanger deux personnes
        j = Math.floor(rnd() * P.length); if (j === i || cur[j] === old) continue;
        oldJ = cur[j]; cur[i] = oldJ; cur[j] = old;
      }
      const sc = evaluate(cur, P, C, w), d = sc - curScore;
      if (d >= 0 || rnd() < Math.exp(d / temp)) {
        curScore = sc;
        if (sc > bestScore) { bestScore = sc; best = cur.slice(); }
      } else { cur[i] = old; if (j >= 0) cur[j] = oldJ; }
    }
  }
  return best;
}

export function autoAssign() {
  const P = staffList(), C = state.clients;
  const seed = [...C.map((c) => c.id), ...P.map((p) => p.id.length)].reduce((h, v) => (h * 31 + v) | 0, 7);
  const a = optimizeAssignment(P, C, seed);
  state.assign = {};
  P.forEach((p, i) => { if (a[i] >= 0) state.assign[p.id] = C[a[i]].id; });
}
export const refreshAssign = () => { if (state.autoAssign) autoAssign(); };

// ---- embauche : les profils viennent des campagnes de recrutement ----
export const isHired = (id) => state.staff.includes(id);
export const candidates = () => state.candidates.map((id) => getEmp(id)).filter(Boolean);

export function hire(id) {
  const e = getEmp(id);
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
