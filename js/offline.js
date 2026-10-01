// Gains hors ligne : 50 % des abonnements moins les salaires (peut etre une perte), plafonnes. L'argent reste >= 0.
import { CONFIG } from "./config.js";
import { state, save } from "./state.js";
import { incomePerSec } from "./clients.js";
import { payroll } from "./staff.js";
import { infoDialog } from "./modal.js";
import { fmt } from "./util.js";
import { sfx } from "./audio.js";
import { streakText } from "./streak.js";

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
  const mine = (incomePerSec() * O.rate - payroll()) * counted;             // abonnements a 50 %, moins les salaires : peut etre negatif
  let euro = mine, hours = 0;
  for (let i = 0; i < state.cities.length; i++) {                         // agences que tu ne diriges pas
    const c = state.cities[i];
    if (i === state.city || !c.data) continue;
    const e = c.passive.euro * O.rate * counted, h = c.passive.hours * O.rate * counted;
    const before = c.data.money;
    c.data.money = Math.max(0, before + e);
    euro += c.data.money - before;
    if (e > 0) c.data.runMoney += e;
    hours += h; c.data.hoursSaved += h; c.data.hoursRun += h; state.lifetimeHours += h;
  }
  const before = state.money;
  state.money = Math.max(0, before + mine);                               // les autres agences ont deja recu leur part dans leur caisse
  const applied = state.money - before;
  euro = euro - mine + applied;
  if (Math.abs(euro) < 0.5 && hours <= 0) return;
  if (euro > 0) state.stats.moneyEarned += euro;
  save();
  sfx.coin();
  const capped = away > O.capHours * 3600 ? `<p class="muted small">Plafond de ${O.capHours} h atteint.</p>` : "";
  infoDialog("Bon retour chez K'X",
    `<p>Tu étais absent ${duration(away)}.</p>
     ${euro >= 0
       ? `<p>Tes clients et tes agences ont continué à produire, salaires déduits : <b class="gold">+${fmt(euro)} EUR</b></p>`
       : `<p>Tes salaires ont dépassé tes revenus pendant ton absence : <b>-${fmt(-euro)} EUR</b>. Ta caisse ne passe jamais sous zéro.</p>`}
     ${streakText() ? `<p class="muted small">${streakText()}</p>` : ""}
     <p class="muted small">Hors ligne, tu touches ${Math.round(O.rate * 100)} % des abonnements.</p>${capped}`,
    "Reprendre");
}
