// Missions : 3 a la fois, objectifs et recompenses calcules sur ta progression actuelle. Pas de chrono.
// Une mission terminee se reclame d'un tap (son + montant qui saute), puis elle est remplacee.
import { CONFIG } from "./config.js";
import { state, securityScore } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { incomePerSec } from "./clients.js";
import { activeTypes, rate } from "./workflows.js";
import { gainMoney } from "./fx.js";
import { el, fmt, setText } from "./util.js";

const M = CONFIG.missions;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (r) => r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
const income = () => Math.max(M.minRate, incomePerSec(), state.flow.euro);       // revenu/s de reference
const levels = () => Object.values(state.auto).reduce((s, w) => s + w.level, 0);

// rang de client le plus haut debloque
function topRank() {
  const keys = Object.keys(CONFIG.sizes);
  let top = 0;
  keys.forEach((k, i) => { const z = CONFIG.sizes[k]; if (state.runMoney >= z.minMoney && state.credibility >= z.minCred && securityScore() >= z.minSec) top = i; });
  return keys[top];
}
const rankBelow = () => { const k = Object.keys(CONFIG.sizes), i = k.indexOf(topRank()); return k[Math.max(0, i - (Math.random() < 0.4 ? 1 : 0))]; };

// chaque type : ok() dit s'il a un sens maintenant ; make() fixe l'objectif d'apres l'etat actuel
const TYPES = {
  sign:    { ok: () => !!state.flags.clients, make: () => ({ rank: rankBelow(), goal: ri(M.signGoal) }) },
  auto:    { ok: () => activeTypes().length > 0, make: () => { const t = pick(activeTypes()); return { taskType: t, goal: Math.max(M.autoMin, Math.min(M.autoMax, Math.round(rate(t) * M.autoSec))) }; } },
  earn:    { ok: () => true, make: () => ({ goal: Math.max(50, Math.round(income() * M.earnSec)), base: state.stats.moneyEarned }) },
  repel:   { ok: () => !!state.flags.security, make: () => ({ goal: ri(M.attackGoal), base: state.stats.attacksRepelled }) },
  enemy:   { ok: () => !!state.flags.security, make: () => ({ goal: 1, base: state.stats.enemiesDestroyed }) },
  sat100:  { ok: () => state.clients.length > 0 && !state.clients.some((c) => c.sat >= 99), make: () => ({ goal: 1 }) },
  levelup: { ok: () => activeTypes().length > 0, make: () => ({ goal: 1, base: levels() }) },
};

function makeReward() {
  if (state.flags.team && Math.random() < M.ticketChance) return { kind: "ticket", amount: 1 };
  if (state.flags.hours && state.flow.hours > 0 && Math.random() < M.hoursChance) return { kind: "hours", amount: Math.max(1, Math.round(state.flow.hours * M.rewardSec)) };
  return { kind: "money", amount: Math.max(M.minReward, Math.round(income() * M.rewardSec)) };
}

function newMission(avoid = []) {
  const all = Object.keys(TYPES).filter((k) => TYPES[k].ok());
  const fresh = all.filter((k) => !avoid.includes(k));
  const type = pick(fresh.length ? fresh : all);
  state.missions.n = (state.missions.n || 0) + 1;
  return { id: state.missions.n, type, p: 0, done: false, reward: makeReward(), ...TYPES[type].make() };
}

export const progressOf = (m) => {
  const v = m.type === "earn" ? state.stats.moneyEarned - m.base
    : m.type === "repel" ? state.stats.attacksRepelled - m.base
    : m.type === "enemy" ? state.stats.enemiesDestroyed - m.base
    : m.type === "levelup" ? levels() - m.base
    : m.p;
  return Math.max(0, Math.min(m.goal, v));
};

export function describe(m) {
  const plural = (n, s) => `${n} ${s}${n > 1 ? "s" : ""}`;
  switch (m.type) {
    case "sign": return `Signer ${plural(m.goal, "client")} ${CONFIG.sizes[m.rank].label}`;
    case "auto": return `Automatiser ${m.goal} tâches « ${CONFIG.tasks[m.taskType].label} »`;
    case "earn": return `Gagner ${fmt(m.goal)} EUR`;
    case "repel": return `Repousser ${plural(m.goal, "attaque")}`;
    case "enemy": return "Détruire un ennemi";
    case "sat100": return "Amener un client à 100 % de satisfaction";
    case "levelup": return "Monter une automatisation d'un niveau";
  }
  return "";
}
export const rewardText = (m) => (m.reward.kind === "money" ? `${fmt(m.reward.amount)} EUR` : m.reward.kind === "hours" ? `${m.reward.amount} h gagnées` : "un ticket de recrutement (profil rare ou mieux)");

export const swapLeft = () => Math.max(0, state.missions.swapAt - state.stats.playSeconds);

export function claim(i) {
  const m = state.missions.list[i];
  if (!m || !m.done) return false;
  if (m.reward.kind === "money") gainMoney(m.reward.amount);
  else if (m.reward.kind === "hours") { state.hoursSaved += m.reward.amount; sfx.coin(); toast(`+${m.reward.amount} heures gagnées`); }
  else { state.tickets++; sfx.unlock(); toast("Ticket de recrutement obtenu : la prochaine campagne te garantit un profil rare ou mieux."); }
  state.missions.list[i] = newMission(state.missions.list.map((x) => x.type));
  return true;
}

// changer une mission : gratuit une fois toutes les 10 min
export function swap(i) {
  const m = state.missions.list[i];
  if (!m || m.done || swapLeft() > 0) return false;
  state.missions.list[i] = newMission(state.missions.list.map((x) => x.type));
  state.missions.swapAt = state.stats.playSeconds + M.swapCooldownSec;
  sfx.tap();
  return true;
}

// ---- suivi ----
on("clientSigned", (o) => { for (const m of state.missions.list) if (m.type === "sign" && !m.done && o.size === m.rank) m.p++; });
on("task", ({ task, auto }) => { if (auto) for (const m of state.missions.list) if (m.type === "auto" && !m.done && task.type === m.taskType) m.p++; });

let acc = 0;
function tick(dt) {
  acc += dt;
  if (acc < 0.5) return;
  acc = 0;
  if (!state.flags.clients) return;                                          // les missions arrivent avec l'onglet Clients
  const MS = state.missions;
  while (MS.list.length < M.count) MS.list.push(newMission(MS.list.map((x) => x.type)));
  const happy = state.clients.some((c) => c.sat >= 99.9);
  for (const m of MS.list) {
    if (m.done) continue;
    if (m.type === "sat100" && happy) m.p = 1;
    if (progressOf(m) >= m.goal) { m.done = true; sfx.ok(); toast(`Mission accomplie : ${describe(m)}. Réclame ta récompense dans Quêtes.`); }
  }
}
export function initMissions() { addSystem(tick); }

// ---- affichage (dans le panneau « Quetes » du haut de l'ecran, voir panels.js) ----
export const missionsSig = () => JSON.stringify([state.missions.list.map((m) => [m.id, m.done]), state.missions.swapAt <= state.stats.playSeconds]);
export function renderMissions(r, live) {
  state.missions.list.forEach((m, i) => {
    const c = el("div", "card mission" + (m.done ? " done" : ""));
    c.innerHTML = `<span class="cinfo"><b>${describe(m)}</b><span class="sdesc">Récompense : ${rewardText(m)}</span><i class="bar"><b></b></i><span class="satline"></span></span>`;
    const bar = c.querySelector(".bar b"), line = c.querySelector(".satline");
    const btn = el("button", m.done ? "btn small-btn" : "btn small-btn ghost", m.done ? "Réclamer" : "Changer");
    btn.onclick = () => (m.done ? claim(i) : swap(i));
    c.append(btn);
    live(() => {
      const v = progressOf(m);
      bar.style.width = (v / m.goal) * 100 + "%";
      setText(line, m.done ? "Terminée" : `${fmt(v)} / ${fmt(m.goal)}`);
      if (!m.done) { const left = swapLeft(); btn.disabled = left > 0; setText(btn, left > 0 ? `Changer · ${Math.ceil(left / 60)} min` : "Changer"); }
    });
    r.append(c);
  });
  r.append(el("p", "muted small", "Changer une mission est gratuit une fois toutes les 10 minutes."));
}
