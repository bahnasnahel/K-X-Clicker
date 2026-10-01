// Securite : mesures permanentes, score de securite et attaques variees (phishing, DDoS, ransomware, fuite de donnees).
// Noah (direction) reduit la frequence des attaques et en bloque une partie ; les mesures en bloquent aussi (selon la sorte).
// Une attaque qui passe ouvre une decision : chaque option a son cout.
import { CONFIG } from "./config.js";
import { state, securityScore } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { bubble } from "./bubbles.js";
import { el, fmt, clamp } from "./util.js";
import { modal } from "./modal.js";
import { activeTypes, auto } from "./workflows.js";
import { spawnTask } from "./tasks.js";
import { incomePerSec, removeClient } from "./clients.js";

const A = CONFIG.attacks, S = CONFIG.security, N = CONFIG.team.noah;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const label = (t) => CONFIG.tasks[t].label;
const noah = () => state.team.noah;

// ---- Mesures ----
export const measure = (id) => S.measures.find((m) => m.id === id);
export const measureLvl = (id) => (state.sec && state.sec[id]) || 0;
export const measureCost = (id) => { const m = measure(id); return Math.round(m.cost[0] * Math.pow(m.cost[1], measureLvl(id))); };
export const measureMaxed = (id) => measureLvl(id) >= measure(id).max;
export const canBuyMeasure = (id) => !measureMaxed(id) && state.money >= measureCost(id);
export function buyMeasure(id) {
  if (!canBuyMeasure(id)) return false;
  state.money -= measureCost(id);
  state.sec ||= {};
  state.sec[id] = measureLvl(id) + 1;
  sfx.ok();
  return true;
}
// chance qu'une mesure bloque une attaque de cette sorte
export const measureBlock = (kind) => {
  const m = S.measures.find((x) => x.kind === kind);
  return m ? Math.min(S.blockMax, measureLvl(m.id) * m.blockPerLevel) : 0;
};

// ---- Noah (direction) ----
export const noahReduce = () => (noah().on ? Math.min(N.reduceMax, N.reduceBase + N.reducePerLevel * noah().lvl) : 0);
export const noahBlock = () => (noah().on ? Math.min(N.blockMax, N.blockBase + N.blockPerLevel * noah().lvl) : 0);

export const attackPower = () => Math.min(A.powerMax, 1 + Math.floor(state.hoursRun / A.powerEveryHours) + state.city);
const fee = (K, p) => (K.feeMin ? Math.round(Math.max(K.feeMin * p, incomePerSec() * K.feeSec)) : 0);

// ---- Lancement d'une attaque ----
function makeMails(n) {
  const P = CONFIG.phishing, pool = [...P.good].sort(() => Math.random() - 0.5).slice(0, n - 1);
  return [{ ...pick(P.bad), bad: true }, ...pool].sort(() => Math.random() - 0.5);
}

export function launchAttack(kind, power = attackPower()) {
  const targets = activeTypes();
  if (state.attack || !targets.length) return false;
  const now = state.stats.playSeconds, K = A.kinds[kind];
  const a = { kind, type: pick(targets), power, deadline: now + A.windowSec, fee: fee(K, power) };
  if (kind === "phishing") a.mails = makeMails(K.mails);
  if (kind === "ransomware") auto(a.type).pausedUntil = a.deadline + K.rebuildPauseSec;   // chiffree en attendant ta decision
  state.attack = a;
  sfx.alert();
  return true;
}

function pickKind() {
  const kinds = Object.entries(A.kinds).filter(([k]) => k !== "leak" || state.clients.length);
  let r = Math.random() * kinds.reduce((s, [, K]) => s + K.weight, 0);
  for (const [k, K] of kinds) if ((r -= K.weight) < 0) return k;
  return kinds[0][0];
}

// ---- Issues ----
function repel(text) {
  state.stats.attacksRepelled++;
  sfx.ok();
  if (noah().on) bubble("noah", text); else toast(text);
}
function bad(text) {
  sfx.error();
  toast(text);
  if (noah().on) bubble("noah", "Celle-là est passée. Renforce tes mesures de sécurité.");
}
const pay = (v) => { state.money = Math.max(0, state.money - v); };

function resolve(a, choice) {
  const K = A.kinds[a.kind], now = state.stats.playSeconds, w = () => auto(a.type);
  state.attack = null;
  if (closeInc) { closeInc(true); closeInc = null; }
  switch (`${a.kind}:${choice}`) {
    case "phishing:ok": repel("Faux mail repéré : personne n'a cliqué."); break;
    case "phishing:miss": {
      w().pausedUntil = now + K.pauseSec;
      const stolen = Math.round(state.money * Math.min(0.4, K.theftPct * a.power));
      pay(stolen);
      bad(`Phishing réussi : « ${label(a.type)} » est en pause${stolen ? `, ${fmt(stolen)} EUR volés` : ""}.`);
      break;
    }
    case "ddos:absorb": pay(a.fee); repel("Attaque DDoS absorbée : rien n'est perdu."); break;
    case "ddos:cut": w().pausedUntil = now + K.cutPauseSec; sfx.tap(); toast(`« ${label(a.type)} » est coupé ${K.cutPauseSec} s le temps que ça passe.`); break;
    case "ddos:ignore": {
      const n = K.tasksBase + K.tasksPerPower * (a.power - 1);
      for (let i = 0; i < n; i++) spawnTask();
      state.stress = clamp(state.stress + K.stress, 0, CONFIG.stress.max);
      bad(`Attaque DDoS subie : ${n} tâches en plus et du stress.`);
      break;
    }
    case "ransomware:pay": pay(a.fee); w().pausedUntil = now; sfx.tap(); toast(`Rançon payée (${fmt(a.fee)} EUR) : « ${label(a.type)} » repart.`); break;
    case "ransomware:restore": w().pausedUntil = now + restoreSec(K); repel(`Sauvegarde restaurée : « ${label(a.type)} » repart dans ${restoreSec(K)} s.`); break;
    case "ransomware:rebuild": w().pausedUntil = now + K.rebuildPauseSec; bad(`« ${label(a.type)} » est reconstruit : ${K.rebuildPauseSec} s d'arrêt.`); break;
    case "leak:warn": state.credibility = clamp(state.credibility + K.warnCred, 0, 100); sfx.tap(); toast("Clients prévenus : la fuite est contenue, ta crédibilité baisse un peu."); break;
    case "leak:pay": pay(a.fee); sfx.tap(); toast(`Clients indemnisés (${fmt(a.fee)} EUR) : l'affaire est close.`); break;
    case "leak:hush":
      if (Math.random() < K.hushRisk) {
        const c = pick(state.clients);
        pay(a.fee * K.scandalFineMult);
        state.credibility = clamp(state.credibility + K.scandalCred, 0, 100);
        if (c) removeClient(c.id, false);
        bad(`Scandale : la fuite est révélée. Amende de ${fmt(a.fee * K.scandalFineMult)} EUR${c ? `, ${c.name} part` : ""} et ta crédibilité s'effondre.`);
      } else { sfx.tap(); toast("Personne n'a rien remarqué. Cette fois."); }
      break;
  }
}
const restoreSec = (K) => Math.max(2, Math.round(K.restorePauseSec * (1 - measure("backup").restoreFaster * measureLvl("backup"))));

// ---- Fenetre de decision ----
let closeInc = null, timer = 0;

export function openIncident() {
  const a = state.attack;
  if (!a || closeInc) return;
  const K = A.kinds[a.kind], money = state.money;
  sfx.tap();
  modal((box, close) => {
    closeInc = close;
    const choose = (c) => { if (state.attack === a) resolve(a, c); };
    const opt = (title, sub, c, off) => {
      const b = el("button", "opt-block", `<b>${title}</b><span>${sub}</span>`);
      b.disabled = !!off;
      b.onclick = () => choose(c);
      return b;
    };
    box.append(el("h3", "h", K.label), el("p", "", K.intro));
    const bar = el("i", "bar", "<b></b>"), left = el("p", "muted small", "");
    box.append(bar, left);
    if (a.kind === "phishing") {
      a.mails.forEach((m) => box.append(opt(m.from, m.subject, m.bad ? "ok" : "miss")));
      box.append(el("p", "muted small", "Une erreur et l'automatisation est piégée. Si tu ne tranches pas à temps, le piège se referme."));
    } else if (a.kind === "ddos") {
      const n = K.tasksBase + K.tasksPerPower * (a.power - 1);
      box.append(
        opt(`Absorber la charge · ${fmt(a.fee)} EUR`, "Tout est filtré, rien n'est perdu.", "absorb", money < a.fee),
        opt(`Couper « ${label(a.type)} » ${K.cutPauseSec} s`, "Le service est en pause, mais aucune tâche en plus.", "cut"),
        opt("Laisser passer", `${n} tâches en plus dans ta boîte et du stress.`, "ignore"));
    } else if (a.kind === "ransomware") {
      const none = !measureLvl("backup");
      box.append(
        opt(`Payer la rançon · ${fmt(a.fee)} EUR`, `« ${label(a.type)} » repart tout de suite. Rien ne garantit qu'ils ne reviendront pas.`, "pay", money < a.fee),
        opt(`Restaurer la sauvegarde · ${restoreSec(K)} s`, none ? "Il faut au moins le niveau 1 de Sauvegardes." : "Rapide et gratuit. Plus tes sauvegardes sont à jour, plus c'est court.", "restore", none),
        opt(`Tout reconstruire · ${K.rebuildPauseSec} s`, "Gratuit, mais l'automatisation reste à l'arrêt longtemps.", "rebuild"));
    } else {
      box.append(
        opt("Prévenir les clients", `Aucune sanction, mais ta crédibilité baisse de ${-K.warnCred} %.`, "warn"),
        opt(`Indemniser · ${fmt(a.fee)} EUR`, "Les clients sont dédommagés : pas de perte de crédibilité.", "pay", money < a.fee),
        opt("Étouffer l'affaire", `${Math.round(K.hushRisk * 100)} % de scandale : amende, un client part et la crédibilité s'effondre. Sinon, rien.`, "hush"));
    }
    const later = el("button", "btn ghost", "Fermer (le temps continue)");
    later.onclick = () => close(true);
    box.append(later);
    const upd = () => {
      if (state.attack !== a) { clearInterval(timer); return; }
      const t = Math.max(0, a.deadline - state.stats.playSeconds);
      bar.firstChild.style.width = (t / A.windowSec) * 100 + "%";
      left.textContent = `Il te reste ${Math.ceil(t)} s.`;
    };
    upd(); clearInterval(timer); timer = setInterval(upd, 200);
  }).then(() => { closeInc = null; clearInterval(timer); });
}

// ---- Boucle ----
let nextAttack = A.everySec * 0.6;

function tick() {
  const now = state.stats.playSeconds;
  if (state.attack && !state.attack.kind) state.attack = null;                  // ancien format
  const a = state.attack;
  if (a) { if (now >= a.deadline) resolve(a, A.kinds[a.kind].fallback); return; }
  if (state.stats.autoDone < A.startAutoDone || now < nextAttack || !activeTypes().length) return;
  const p = attackPower();
  nextAttack = now + (A.everySec / (1 + A.frequencyPerPower * p)) / Math.max(0.2, 1 - noahReduce()) * (0.7 + Math.random() * 0.6);
  const kind = pickKind(), K = A.kinds[kind];
  if (Math.random() < noahBlock()) repel(`Noah a bloqué une attaque : ${K.label.toLowerCase()}.`);
  else if (Math.random() < measureBlock(kind)) repel(`Tes mesures ont bloqué une attaque : ${K.label.toLowerCase()}.`);
  else launchAttack(kind, p);
}

on("agencyReset", () => { nextAttack = A.everySec * 0.6 + state.stats.playSeconds; if (closeInc) { closeInc(true); closeInc = null; } });

export function initSecurity() {
  nextAttack = state.stats.playSeconds + A.everySec * 0.6;
  addSystem(tick);
}

export { securityScore };
