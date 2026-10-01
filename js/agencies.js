// Agences : une par ville, qui tournent en parallele. Remise a zero de l'agence active pour gagner des points.
import { CONFIG } from "./config.js";
import { state, AGENCY_FIELDS, freshAgencyFields } from "./state.js";
import { addSystem } from "./loop.js";
import { emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { payroll } from "./staff.js";
import { state as S0, gainMult, nahelMult, shopPct } from "./state.js";
import { availableTypes, baseDifficulty, arrivalFactor } from "./tasks.js";
import { level as autoLevel, rate as autoRate, diffMult } from "./workflows.js";
import { passes } from "./taskdata.js";

const P = CONFIG.prestige;
export const cityName = (i = state.city) => P.cities[i];
export const owned = (i) => !!state.cities[i].unlocked;
export const price = (i) => P.prices[i];
// les agences se debloquent dans l'ordre
// L'argent est propre a chaque agence, SAUF pour acheter une agence : l'argent de toutes tes agences compte.
export const totalMoney = () => state.cities.reduce((sum, c, i) => sum + (i === state.city ? state.money : c.data ? c.data.money : 0), 0);
export const canBuy = (i) => !owned(i) && (i === 0 || owned(i - 1)) && totalMoney() >= price(i);
// paie un montant : d'abord l'argent de l'agence active, puis celui des autres agences
function spendTotal(amount) {
  const take = Math.min(state.money, amount);
  state.money -= take; amount -= take;
  for (let i = 0; i < state.cities.length && amount > 0; i++) {
    const d = state.cities[i].data;
    if (i === state.city || !d) continue;
    const t = Math.min(d.money, amount);
    d.money -= t; amount -= t;
  }
}
export const nextToBuy = () => P.cities.findIndex((_, i) => !owned(i));

function resetFlow() { state.flow = { accE: 0, accH: 0, euro: 0, hours: 0 }; }
const snapshot = () => Object.fromEntries(AGENCY_FIELDS.map((f) => [f, state[f]]));
function restore(data) {
  const base = freshAgencyFields(state.city);
  for (const f of AGENCY_FIELDS) state[f] = f in data ? data[f] : base[f];
}

// ---- achat d'une agence (en EUR, commun a toute l'entreprise) ----
export function buyAgency(i) {
  if (!canBuy(i)) return false;
  spendTotal(price(i));
  state.cities[i].unlocked = true;
  state.cities[i].data = freshAgencyFields(i);
  sfx.unlock();
  toast(`K'X ${cityName(i)} est ouverte. Va la diriger depuis l'onglet Agences.`, 4500);
  return true;
}

// ---- passer d'une agence a l'autre : l'ancienne continue de produire ----
// Estimation (par seconde) de ce que rapporteraient les taches A LA MAIN qui ne sont pas absorbees par les
// automatisations : on suppose que l'equipe les traite. Arrivees : taches "maison" + taches des clients.
export function manualEstimate() {
  const types = availableTypes();
  if (!types.length) return 0;
  const wTot = types.reduce((sum, t) => sum + CONFIG.tasks[t].weight, 0);
  const items = [];
  const baseLam = 1 / (CONFIG.queue.baseSpawnEverySec * arrivalFactor());
  for (const t of types) items.push({ t, lam: (baseLam * CONFIG.tasks[t].weight) / wTot, d: baseDifficulty() });
  for (const c of state.clients) {
    const ok = c.types.filter((t) => types.includes(t));
    if (!ok.length) continue;
    const lam = 1 / (c.every * arrivalFactor());
    for (const t of ok) items.push({ t, lam: lam / ok.length, d: c.need.skill });
  }
  let euro = 0;
  for (const t of types) {
    const its = items.filter((i) => i.t === t), total = its.reduce((sum, i) => sum + i.lam, 0);
    if (!total) continue;
    const L = autoLevel(t), handled = its.filter((i) => L >= Math.max(1, i.d));
    const lamH = handled.reduce((sum, i) => sum + i.lam, 0);
    const avgPasses = lamH ? handled.reduce((sum, i) => sum + i.lam * passes(i.d), 0) / lamH : 1;
    const capacity = L > 0 ? autoRate(t) / avgPasses : 0;           // taches/s que l'automatisation sait traiter
    const residual = total - Math.min(lamH, capacity);               // le reste serait fait a la main
    const value = its.reduce((sum, i) => sum + i.lam * CONFIG.tasks[t].euro * diffMult(i.d), 0) / total;
    euro += residual * value;
  }
  return euro * gainMult() * nahelMult() * shopPct("taskGain");
}

export function passiveRates() {
  const manual = manualEstimate();
  return { euro: Math.max(0, state.flow.euro + manual - payroll()), hours: state.flow.hours, manual };
}

export function switchAgency(to) {
  if (to === state.city || !owned(to) || !state.cities[to].data) return false;
  const cur = state.cities[state.city];
  cur.passive = passiveRates();
  cur.data = snapshot();
  const next = state.cities[to];
  state.city = to;
  restore(next.data);
  next.data = null;
  resetFlow();
  emit("agencyReset");
  sfx.tap();
  toast(`Tu diriges maintenant K'X ${cityName(to)}.`);
  return true;
}

// ---- remise a zero de l'agence active : points pour la boutique permanente ----
export const pointsGain = () => Math.floor(Math.pow(state.hoursRun / P.pointsDivisor, P.pointsPower));
export function rebirth() {
  const g = pointsGain();
  if (g < 1) return false;
  state.points += g; state.pointsEarned += g; state.rebirths++;
  const f = freshAgencyFields(state.city);
  for (const k of AGENCY_FIELDS) state[k] = f[k];
  state.stats.cleanSince = null;
  resetFlow();
  emit("agencyReset");
  sfx.unlock();
  toast(`Agence remise à zéro : +${g} point${g > 1 ? "s" : ""} pour la boutique.`, 4500);
  return true;
}

// ---- production des agences que tu ne diriges pas + rythme de l'agence active ----
let acc = 0;
function tick(dt) {
  acc += dt;
  if (acc >= 5) {                       // moyenne glissante du rythme recent
    state.flow.euro = state.flow.euro * 0.7 + (state.flow.accE / acc) * 0.3;
    state.flow.hours = state.flow.hours * 0.7 + (state.flow.accH / acc) * 0.3;
    state.flow.accE = 0; state.flow.accH = 0; acc = 0;
  }
  for (let i = 0; i < state.cities.length; i++) {
    const c = state.cities[i];
    if (i === state.city || !c.data) continue;
    const e = c.passive.euro * P.passiveFactor * dt, h = c.passive.hours * P.passiveFactor * dt;
    c.data.money += e; state.stats.moneyEarned += e; c.data.runMoney += e;
    c.data.hoursSaved += h; c.data.hoursRun += h; state.lifetimeHours += h;
  }
}

export function initAgencies() { addSystem(tick); }
