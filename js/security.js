// Securite : mesures permanentes, score de securite et attaques variees (phishing, DDoS, ransomware, fuite de donnees).
// Les attaques viennent d'ennemis (plus d'argent gagne = plus d'ennemis, plus forts). Noah les traque et les detruit.
// Les mesures bloquent une partie des attaques. Une attaque qui passe ouvre une decision : chaque option a son cout.
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

const A = CONFIG.attacks, S = CONFIG.security, N = CONFIG.team.noah, E = CONFIG.enemies;
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

// ---- Ennemis ----
const L1 = (lvl) => E.levels[lvl - 1];
export const heat = () => Math.log10(1 + state.runMoney / E.moneyScale);
export const enemyCap = () => Math.min(E.capMax, Math.floor(E.capBase + E.capPerHeat * heat()));
const maxEnemyLevel = () => Math.min(E.levels.length, 1 + Math.floor(heat() / E.heatPerLevel));
export const enemyLabel = (e) => L1(e.lvl);
export const styleOf = (e) => E.styles[e.style];
const attackGap = (e) => E.attackEverySec / (1 + E.attackPerLevel * (e.lvl - 1)) / styleOf(e).rate;   // delai moyen entre deux attaques

function spawnEnemy() {
  const now = state.stats.playSeconds;
  const lvl = Math.min(maxEnemyLevel(), 1 + Math.floor(Math.pow(Math.random(), E.levelBias) * maxEnemyLevel()));
  const style = pick(Object.keys(E.styles)), st = E.styles[style];
  const kinds = Object.keys(A.kinds);
  const e = {
    id: state.nextEnemyId++, lvl, style, kind: pick(kinds),
    name: `${pick(E.names)}_${10 + Math.floor(Math.random() * 90)}`,
    power: Math.max(1, Math.min(A.powerMax, Math.round((1 + E.powerPerLevel * (lvl - 1)) * st.power) + state.city)),
  };
  e.maxHp = e.hp = Math.round(E.hpBase * Math.pow(lvl, E.hpPow) * st.hp);
  e.next = now + attackGap(e) * (0.5 + Math.random() * 0.5);
  state.enemies.push(e);
  bubble("noah", `Nouvel ennemi repéré : ${e.name} (${L1(lvl)}, ${st.label.toLowerCase()}).`);
}

// ---- Noah : traque et detruit les ennemis, un par un ----
export const huntSpeed = () => (noah().on ? N.huntBase + N.huntPerLevel * noah().lvl : 0);
export const MODES = { strong: "Le plus fort", weak: "Le plus faible", order: "Ordre d'apparition" };
export const huntMode = () => noah().mode || "strong";
export const setHuntMode = (m) => { noah().mode = m; sfx.tap(); };
// nombre d'ennemis traques en meme temps : 1, +1 tous les 10 niveaux de Noah
export const huntCount = () => (noah().on ? 1 + Math.floor(noah().lvl / N.huntEvery) : 0);
export function huntTargets() {
  const m = huntMode();
  const f = (e) => e.lvl * 1000 + e.maxHp;                       // force : niveau, puis temps de traque
  const sorted = [...state.enemies].sort(m === "order" ? (a, b) => a.id - b.id : m === "weak" ? (a, b) => f(a) - f(b) : (a, b) => f(b) - f(a));
  return sorted.slice(0, huntCount());
}
export const bounty = (e) => Math.round(Math.max(E.bountyMin * e.lvl, incomePerSec() * E.bountySec * e.lvl));

function destroy(e) {
  state.enemies = state.enemies.filter((x) => x.id !== e.id);
  const b = bounty(e);
  state.money += b; state.runMoney += b; state.stats.moneyEarned += b;
  state.stats.enemiesDestroyed++;
  sfx.coin();
  bubble("noah", `${e.name} est neutralisé. Justice rendue : +${fmt(b)} EUR.`);
}

const fee = (K, p) => (K.feeMin ? Math.round(Math.max(K.feeMin * p, incomePerSec() * K.feeSec)) : 0);

// ---- Lancement d'une attaque ----
function makeMails(n) {
  const P = CONFIG.phishing, pool = [...P.good].sort(() => Math.random() - 0.5).slice(0, n - 1);
  return [{ ...pick(P.bad), bad: true }, ...pool].sort(() => Math.random() - 0.5);
}

export function launchAttack(kind, power = 1 + state.city, by = "") {
  const targets = activeTypes();
  if (state.attack || !targets.length) return false;
  const now = state.stats.playSeconds, K = A.kinds[kind];
  const a = { kind, type: pick(targets), power, by, deadline: now + A.windowSec, fee: fee(K, power) };
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
    box.append(el("h3", "h", K.label), el("p", "", (a.by ? `<b>${a.by}</b> t'attaque. ` : "") + K.intro));
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
  }, { live: true }).then(() => { closeInc = null; clearInterval(timer); });
}

// ---- Boucle ----
let nextSpawn = E.firstSpawnSec;

function enemyAttack(e, now) {
  e.next = now + attackGap(e) * (0.7 + Math.random() * 0.6);
  let kind = Math.random() < E.favouriteChance ? e.kind : pick(Object.keys(A.kinds));
  if (kind === "leak" && !state.clients.length) kind = "phishing";
  const K = A.kinds[kind];
  if (Math.random() < measureBlock(kind)) repel(`Tes mesures ont bloqué ${e.name} : ${K.label.toLowerCase()}.`);
  else launchAttack(kind, e.power, e.name);
}

function tick(dt) {
  const now = state.stats.playSeconds;
  if (state.attack && !state.attack.kind) state.attack = null;                  // ancien format
  if (!state.enemies) state.enemies = [];
  const a = state.attack;
  if (a && now >= a.deadline) resolve(a, A.kinds[a.kind].fallback);
  if (!state.flags.security || state.stats.autoDone < A.startAutoDone) return;

  if (!noah().on) { noah().on = true; noah().lvl = Math.max(noah().lvl, state.shop.startDir || 0); }   // Noah est offert, niveau 0

  // arrivee de nouveaux ennemis : plus d'argent gagne, plus ils arrivent
  if (now >= nextSpawn) {
    nextSpawn = now + (E.spawnEverySec / (1 + E.spawnPerHeat * heat())) * (0.7 + Math.random() * 0.6);
    if (state.enemies.length < enemyCap()) spawnEnemy();
  }

  // Noah traque l'ennemi vise
  for (const t of huntTargets()) { t.hp -= huntSpeed() * dt; if (t.hp <= 0) destroy(t); }

  // chaque ennemi attaque a son rythme (une seule attaque a la fois)
  for (const e of state.enemies) {
    if (now < e.next) continue;
    if (state.attack || !activeTypes().length) { e.next = now + 4; continue; }
    enemyAttack(e, now);
  }
}

on("agencyReset", () => { nextSpawn = E.firstSpawnSec + state.stats.playSeconds; if (closeInc) { closeInc(true); closeInc = null; } });

export function initSecurity() {
  nextSpawn = state.stats.playSeconds + E.firstSpawnSec;
  addSystem(tick);
}

export { securityScore };
