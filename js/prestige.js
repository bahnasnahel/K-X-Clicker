// Prestige : ouvrir une nouvelle agence.
import { CONFIG } from "./config.js";
import { state, defaults, normalize, save } from "./state.js";
import { emit } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";

const P = CONFIG.prestige;
export const cityName = (i = state.city) => P.cities[i];
export const isLastCity = () => state.city >= P.cities.length - 1;
export const nextCity = () => Math.min(state.city + 1, P.cities.length - 1);
export const threshold = () => P.thresholds[state.city];
export const canOpen = () => state.hoursRun >= threshold();
export const repGain = () => Math.max(1, Math.floor(state.hoursRun / P.repPerHours));

// on garde : direction (Nahel, Yanis, Jadd, Noah), succes, deblocages, reputation
const RESET = ["money", "hoursSaved", "hoursRun", "runMoney", "stress", "heat", "queue", "offers", "clients", "auto", "staff", "assign", "servers", "attack", "credibility"];

export function openAgency() {
  if (!canOpen()) return false;
  const gain = repGain();
  const fresh = defaults();
  state.reputation += gain;
  state.city = nextCity();
  for (const k of RESET) state[k] = fresh[k];
  state.stats.cleanSince = null;
  normalize();
  emit("agencyReset");
  save();
  sfx.unlock();
  toast(`K'X ouvre à ${cityName()}. Réputation +${gain}.`, 4500);
  return true;
}
