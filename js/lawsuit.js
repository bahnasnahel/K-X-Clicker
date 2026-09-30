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

const cred = (v) => { state.credibility = clamp(state.credibility + v, 0, 100); };

function trigger() {
  const worst = [...state.clients].sort((a, b) => service(a) - service(b))[0];
  if (!worst) return;
  open = true;
  state.stats.lawsuits++;
  nextAt = state.stats.playSeconds + L.cooldownSec;
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
    const court = el("button", "btn danger", `Plaider (${Math.round(L.courtWinChance * 100)} % de gagner)`);
    court.onclick = () => {
      if (Math.random() < L.courtWinChance) {
        cred(L.courtWinCred); sfx.unlock(); toast("Procès gagné. Ta crédibilité remonte.");
      } else {
        state.money = Math.max(0, state.money - fine * L.courtLoseCostMult);
        cred(L.courtLoseCred); sfx.error();
        removeClient(worst.id, false);
        toast(`Procès perdu : amende de ${fmt(fine * L.courtLoseCostMult)} EUR et ${worst.name} part.`);
      }
      open = false; close();
    };
    box.append(settle, court, el("p", "muted small", "À l'amiable, c'est sûr mais ça coûte. Au tribunal, tu peux tout gagner ou tout perdre."));
  });
}

function tick(dt) {
  acc += dt;
  if (acc < L.checkEverySec) return;
  acc = 0;
  if (open || state.stats.playSeconds < nextAt) return;
  if (state.credibility < L.below && state.clients.length && Math.random() < L.chance) trigger();
}

on("agencyReset", () => { nextAt = 0; open = false; });
export function initLawsuit() { addSystem(tick); }
