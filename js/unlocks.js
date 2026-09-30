// Progression : le contenu apparait au fur et a mesure (onglets, types de taches, compteurs).
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { toast } from "./toast.js";
import { bubble } from "./bubbles.js";
import { sfx } from "./audio.js";

export const has = (id) => !!state.flags[id];

let acc = 0, cooldown = 0;
function tick(dt) {
  cooldown -= dt;
  acc += dt;
  if (acc < 0.5) return;
  acc = 0;
  for (const u of CONFIG.unlocks) {
    if (state.flags[u.id] || !u.when(state)) continue;
    state.flags[u.id] = true;           // un deblocage est definitif, meme apres une nouvelle agence
    if (cooldown > 0) continue;         // un message a la fois
    if (u.msg) toast(u.msg);
    if (u.who && u.text) bubble(u.who, u.text, 8000);
    sfx.unlock();
    cooldown = 2.5;
    break;
  }
}

// Etat de depart : tout ce qui est deja vrai est debloque sans bruit (sauvegarde chargee).
export function initUnlocks() {
  for (const u of CONFIG.unlocks) if (!state.flags[u.id] && state.stats.tasksDone > 0 && u.when(state)) state.flags[u.id] = true;
  addSystem(tick);
}
