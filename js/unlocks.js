// Progression : le contenu apparait au fur et a mesure. Chaque deblocage met le jeu en pause avec
// une explication, puis on laisse jouer (unlockGapSec) avant la suivante.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { explain } from "./tutorial.js";

export const has = (id) => !!state.flags[id];

let acc = 0, lastAt = -1e9, busy = false;
function tick(dt) {
  acc += dt;
  if (acc < 0.5 || busy) return;
  acc = 0;
  if (document.querySelector(".tuto, .overlay")) return;                   // une fenetre est deja ouverte
  for (const u of CONFIG.unlocks) {
    if (state.flags[u.id] || !u.when(state)) continue;
    if (state.stats.playSeconds - lastAt < (u.gap ?? CONFIG.unlockGapSec)) break;   // on laisse jouer un peu
    state.flags[u.id] = true;
    lastAt = state.stats.playSeconds;
    busy = true;
    explain(u.who, u.text, { title: u.title }).then(() => { busy = false; lastAt = state.stats.playSeconds; });
    break;                                                                 // une seule explication a la fois
  }
}

// Sauvegarde chargee : ce qui est deja vrai est debloque sans explication.
export function initUnlocks() {
  lastAt = state.stats.playSeconds;
  for (const u of CONFIG.unlocks) if (!state.flags[u.id] && state.stats.tasksDone > 0 && u.when(state)) state.flags[u.id] = true;
  addSystem(tick);
}
