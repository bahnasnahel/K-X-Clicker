// Progression : le contenu apparait au fur et a mesure. Chaque deblocage met le jeu en pause avec
// une explication. Le rythme se fait au nombre de taches (pas au temps).
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { explain } from "./tutorial.js";
import { prefillForNextGoal } from "./tasks.js";

export const has = (id) => !!state.flags[id];

let acc = 0, lastActs = -1e9, busy = false;
const acts = () => state.stats.tasksDone + state.stats.autoDone;   // actions du joueur
function tick(dt) {
  acc += dt;
  if (acc < 0.5 || busy) return;
  acc = 0;
  if (document.querySelector(".tuto, .overlay")) return;                   // une fenetre est deja ouverte
  for (const u of CONFIG.unlocks) {
    if (state.flags[u.id] || !u.when(state)) continue;
    if (acts() - lastActs < CONFIG.unlockGapTasks) break;                  // au moins une tache entre deux explications
    state.flags[u.id] = true;
    busy = true;
    explain(u.who, u.text, { title: u.title }).then(() => { busy = false; lastActs = acts(); prefillForNextGoal(); });
    break;                                                                 // une seule explication a la fois
  }
}

// Sauvegarde chargee : ce qui est deja vrai est debloque sans explication.
export function initUnlocks() {
  lastActs = acts();
  for (const u of CONFIG.unlocks) if (!state.flags[u.id] && state.stats.tasksDone > 0 && u.when(state)) state.flags[u.id] = true;
  addSystem(tick);
}
