// Gains hors ligne : 50 % des abonnements, plafonnes.
import { CONFIG } from "./config.js";
import { state, save } from "./state.js";
import { incomePerSec } from "./clients.js";
import { payroll } from "./staff.js";
import { infoDialog } from "./modal.js";
import { fmt } from "./util.js";
import { sfx } from "./audio.js";

function duration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  if (m > 0) return `${m} min`;
  return `${Math.floor(sec)} s`;
}

// Appele au chargement et quand l'application revient au premier plan.
export function checkOffline() {
  const O = CONFIG.offline;
  const away = (Date.now() - state.meta.lastActive) / 1000;
  state.meta.lastActive = Date.now();
  if (away < O.minAwaySeconds) return;
  const counted = Math.min(away, O.capHours * 3600);
  const mine = Math.max(0, incomePerSec() * O.rate - payroll()) * counted;   // abonnements a 50 %, moins les salaires
  let euro = mine;
  for (let i = 0; i < state.cities.length; i++) {                         // agences que tu ne diriges pas
    const c = state.cities[i];
    if (i === state.city || !c.data) continue;
    const e = c.passive.euro * O.rate * counted, h = c.passive.hours * O.rate * counted;
    euro += e; c.data.money += e; c.data.runMoney += e; c.data.hoursSaved += h; c.data.hoursRun += h; state.lifetimeHours += h;
  }
  if (euro <= 0) return;
  state.money += mine;                                                    // les autres agences ont deja recu leur part dans leur caisse
  state.stats.moneyEarned += euro;
  save();
  sfx.coin();
  const capped = away > O.capHours * 3600 ? `<p class="muted small">Plafond de ${O.capHours} h atteint.</p>` : "";
  infoDialog("Bon retour chez K'X",
    `<p>Tu étais absent ${duration(away)}.</p>
     <p>Tes clients et tes agences ont continué à produire, salaires déduits : <b class="gold">+${fmt(euro)} EUR</b></p>
     <p class="muted small">Hors ligne, tu touches ${Math.round(O.rate * 100)} % des abonnements.</p>${capped}`,
    "Reprendre");
}
