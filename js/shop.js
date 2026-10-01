// Boutique permanente : on y depense les points gagnes en remettant une agence a zero.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { sfx } from "./audio.js";

export const items = () => CONFIG.shop.items;
export const level = (id) => state.shop[id] || 0;
export const maxed = (it) => level(it.id) >= it.max;
export const cost = (it) => Math.ceil(it.cost[0] * Math.pow(it.cost[1], level(it.id)));
export const canBuy = (it) => !maxed(it) && state.points >= cost(it);

export function buy(id) {
  const it = items().find((i) => i.id === id);
  if (!it || !canBuy(it)) return false;
  state.points -= cost(it);
  state.shop[id] = level(id) + 1;
  sfx.unlock();
  return true;
}

// texte de l'effet pour un niveau donne
export function effectText(it, lvl) {
  const v = it.per * lvl;
  switch (it.unit) {
    case "eur": return `+${v} EUR`;
    case "pct": return `${it.group === 1 ? "-" : "+"}${v} %`;
    case "pts": return `+${v} points`;
    case "count": return `${v}`;
    default: return `niveau ${v}`;
  }
}
