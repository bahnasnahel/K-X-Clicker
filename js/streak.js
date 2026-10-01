// Serie de jours : jours d'affilee ou tu ouvres le jeu (date locale). A la premiere ouverture du jour :
// de l'argent qui grandit avec la serie (plafonnee) et un bonus de gains pour la journee. Un jour manque remet la serie a 1.
import { CONFIG } from "./config.js";
import { state, streakBonus } from "./state.js";
import { incomePerSec } from "./clients.js";
import { gainMoney } from "./fx.js";
import { toast } from "./toast.js";
import { fmt } from "./util.js";

const S = CONFIG.streak;
const key = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return key(d); };

export const streakPct = () => Math.min(S.gainMax, S.gainPerDay * state.streak.count);   // +5 % par jour, plafonne
const applyBonus = () => { streakBonus.mult = state.streak.day === key() ? 1 + streakPct() : 1; };

// texte court de la serie (interface et message de retour) ; "" si pas de serie
export const streakText = () => (state.streak.count ? `Série : ${state.streak.count} jour${state.streak.count > 1 ? "s" : ""}${state.streak.day === key() ? ` · +${Math.round(streakPct() * 100)} % de gains` : ""}` : "");

// A appeler au demarrage et au retour dans l'application : premiere ouverture du jour ?
export function checkStreak() {
  const st = state.streak, today = key();
  if (st.last !== today) {
    st.count = st.last === yesterday() ? st.count + 1 : 1;                      // jour manque : retour a 1
    st.last = today; st.day = today;
    if (state.settings.tutorialDone) {
      const days = Math.min(st.count, S.capDays);
      const reward = Math.round(Math.max(S.rewardMin, incomePerSec() * S.rewardSec) * days);
      gainMoney(reward);
      toast(`Série de ${st.count} jour${st.count > 1 ? "s" : ""} : +${fmt(reward)} EUR et +${Math.round(streakPct() * 100)} % de gains aujourd'hui.`, 4500);
    }
  }
  applyBonus();
}
