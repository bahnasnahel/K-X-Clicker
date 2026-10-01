// Agences : une par ville, qui tournent en parallele. Remise a zero de l'agence active pour gagner des points.
import { CONFIG } from "./config.js";
import { state, AGENCY_FIELDS, freshAgencyFields } from "./state.js";
import { addSystem } from "./loop.js";
import { emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { payroll } from "./staff.js";

const P = CONFIG.prestige;
export const cityName = (i = state.city) => P.cities[i];
export const owned = (i) => !!state.cities[i].unlocked;
export const price = (i) => P.prices[i];
// les agences se debloquent dans l'ordre
export const canBuy = (i) => !owned(i) && (i === 0 || owned(i - 1)) && state.money >= price(i);
export const nextToBuy = () => P.cities.findIndex((_, i) => !owned(i));

const startMoney = () => {
  const it = CONFIG.shop.items.find((x) => x.id === "startMoney");
  return it.per * (state.shop.startMoney || 0);
};

function resetFlow() { state.flow = { accE: 0, accH: 0, euro: 0, hours: 0 }; }
const snapshot = () => Object.fromEntries(AGENCY_FIELDS.map((f) => [f, state[f]]));
function restore(data) {
  const base = freshAgencyFields(state.city);
  for (const f of AGENCY_FIELDS) state[f] = f in data ? data[f] : base[f];
}

// ---- achat d'une agence (en EUR, commun a toute l'entreprise) ----
export function buyAgency(i) {
  if (!canBuy(i)) return false;
  state.money -= price(i);
  state.cities[i].unlocked = true;
  state.cities[i].data = freshAgencyFields(i);
  state.money += startMoney();
  sfx.unlock();
  toast(`K'X ${cityName(i)} est ouverte. Va la diriger depuis l'onglet Agences.`, 4500);
  return true;
}

// ---- passer d'une agence a l'autre : l'ancienne continue de produire ----
export function passiveRates() {
  return { euro: Math.max(0, state.flow.euro - payroll()), hours: state.flow.hours };
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
  state.money += startMoney();
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
    state.money += e; state.stats.moneyEarned += e; c.data.runMoney += e;
    c.data.hoursSaved += h; c.data.hoursRun += h; state.lifetimeHours += h;
  }
}

export function initAgencies() { addSystem(tick); }
