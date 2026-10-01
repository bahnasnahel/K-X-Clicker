// Petits effets : montant qui saute quand l'argent rentre d'un coup (mission, bonus dore, remerciement, ennemi detruit).
import { el } from "./util.js";
import { sfx } from "./audio.js";
import { state } from "./state.js";

// "+850 EUR", "+1,2 k EUR", "+3 M EUR"
export function fmtShort(n) {
  n = Math.round(n);
  const f = (v, unit) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1).replace(".", ",").replace(",0", "")) + " " + unit;
  if (n < 1000) return `${n} €`;
  if (n < 1e6) return f(n / 1e3, "k€");
  if (n < 1e9) return f(n / 1e6, "M€");
  return f(n / 1e9, "G€");
}

// Ajoute de l'argent a l'agence active (comme un gain), avec le montant qui saute et le son des pieces.
export function gainMoney(amount) {
  state.money += amount; state.runMoney += amount; state.stats.moneyEarned += amount;
  moneyPop(amount);
}

// Montant qui saute depuis le compteur d'argent. Ne modifie pas l'argent : voir gainMoney().
export function moneyPop(amount, withSound = true) {
  if (withSound) sfx.coin();
  const anchor = document.getElementById("cell-money");
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const p = el("div", "moneypop", "+" + fmtShort(amount));
  p.style.left = r.left + r.width / 2 + "px";
  p.style.top = r.top + r.height / 2 + "px";
  document.body.append(p);
  setTimeout(() => p.remove(), 1300);
}
