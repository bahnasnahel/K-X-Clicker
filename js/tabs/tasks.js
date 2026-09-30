import { el, fmt } from "../util.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";

// TEMPORAIRE (etape 2) : bouton de test du socle. Remplace par la file de taches a l'etape 3.
export default {
  id: "tasks", label: "Tâches", icon: "tasks",
  mount(root) {
    root.append(el("h2", "h", "Boîte de tâches"),
      el("p", "muted", "La vraie file de tâches arrive à l'étape 3. Pour l'instant, cette zone sert à tester le socle : compteurs, sons et sauvegarde."));
    const b = el("button", "btn big", "Encaisser 1 € (test)");
    b.onclick = () => { state.money += 1; state.hoursSaved += 1; state.stress = Math.min(100, state.stress + 5); state.heat = Math.min(100, state.heat + 3); sfx.coin(); };
    const b2 = el("button", "btn ghost", "Gagner 25 h (test du bureau)");
    b2.onclick = () => { state.hoursSaved += 25; sfx.unlock(); };
    root.append(b, b2);
  },
  update() {},
};
