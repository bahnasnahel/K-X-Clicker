// Evenement : un client mal servi attaque en justice quand la credibilite est au plus bas.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { el, fmt, clamp } from "./util.js";
import { modal } from "./modal.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { service } from "./staff.js";
import { removeClient } from "./clients.js";

const L = CONFIG.lawsuit;
let acc = 0, nextAt = 0, open = false;

// chance de gagner : lineaire selon le service rendu a ce client (peu de service = peu de chance)
const winChance = (c) => {
  const t = clamp((service(c) - L.serviceLow) / (L.serviceHigh - L.serviceLow), 0, 1);
  return L.courtWinMin + (L.courtWinMax - L.courtWinMin) * t;
};

const cred = (v) => { state.credibility = clamp(state.credibility + v, 0, 100); };

function trigger() {
  const worst = [...state.clients].sort((a, b) => service(a) - service(b))[0];
  if (!worst) return;
  open = true;
  state.stats.lawsuits++;
  nextAt = state.stats.playSeconds + L.cooldownSec;
  const chance = winChance(worst);
  const fine = Math.round(L.fineBase * (1 + state.city) * (1 + Math.min(state.runMoney, 20000) / 20000));
  sfx.alert();
  modal((box, close) => {
    box.append(el("h3", "h", "Procès !"));
    box.append(el("p", "", `${worst.name} t'attaque en justice : le service n'était pas à la hauteur. Amende demandée : <b class="gold">${fmt(fine)} EUR</b>.`));
    const settle = el("button", "btn", `Régler à l'amiable (${fmt(fine)} EUR)`);
    settle.onclick = () => {
      state.money = Math.max(0, state.money - fine);
      cred(L.settleCred);
      const c = state.clients.find((x) => x.id === worst.id); if (c) c.sat = Math.min(100, c.sat + 15);
      toast("Affaire réglée à l'amiable.");
      open = false; close();
    };
    const court = el("button", "btn danger", `Plaider (${Math.round(chance * 100)} % de gagner)`);
    court.onclick = () => {
      if (Math.random() < chance) {
        const dmg = Math.round(fine * L.damagesShare);
        state.money += dmg; state.runMoney += dmg; state.stats.moneyEarned += dmg;
        cred(L.courtWinCred); sfx.unlock(); toast(`Procès gagné : ${worst.name} te verse ${fmt(dmg)} EUR de dommages et ta crédibilité remonte.`);
      } else {
        state.money = Math.max(0, state.money - fine * L.courtLoseCostMult);
        cred(L.courtLoseCred); sfx.error();
        removeClient(worst.id, false);
        toast(`Procès perdu : amende de ${fmt(fine * L.courtLoseCostMult)} EUR et ${worst.name} part.`);
      }
      open = false; close();
    };
    box.append(settle, court, el("p", "muted small", "À l'amiable, c'est sûr mais ça coûte. Au tribunal, tu peux tout gagner ou tout perdre : plus ce client était bien servi, plus tu as de chances de gagner."));
  }, { lock: true });
}

function tick(dt) {
  acc += dt;
  if (acc < L.checkEverySec) return;
  acc = 0;
  if (open || state.stats.playSeconds < nextAt || state.stats.moneyEarned < 600 || state.clients.length < 2) return;   // jamais pendant la decouverte
  if (state.credibility < L.below && state.clients.length && Math.random() < L.chance) trigger();
}

on("agencyReset", () => { nextAt = 0; open = false; });
export function initLawsuit() { addSystem(tick); }
