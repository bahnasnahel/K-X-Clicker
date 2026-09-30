// Gains hors ligne : 50 % des abonnements, plafonnes.
import { CONFIG } from "./config.js";
import { state, save } from "./state.js";
import { incomePerSec } from "./clients.js";
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
  if (away < O.minAwaySeconds || state.clients.length === 0) return;
  const counted = Math.min(away, O.capHours * 3600);
  const euro = incomePerSec() * counted * O.rate;
  if (euro <= 0) return;
  state.money += euro;
  state.stats.moneyEarned += euro;
  save();
  sfx.coin();
  const capped = away > O.capHours * 3600 ? `<p class="muted small">Plafond de ${O.capHours} h atteint.</p>` : "";
  infoDialog("Bon retour chez K'X",
    `<p>Tu étais absent ${duration(away)}.</p>
     <p>Tes ${state.clients.length} client${state.clients.length > 1 ? "s" : ""} ont continué à payer : <b class="gold">+${fmt(euro)} EUR</b></p>
     <p class="muted small">Hors ligne, tu touches ${Math.round(O.rate * 100)} % des abonnements.</p>${capped}`,
    "Reprendre");
}
