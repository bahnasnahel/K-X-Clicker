import { el, liveView } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { rewardText } from "../achievements.js";

export default {
  id: "success", label: "Succès", icon: "trophy",
  mount(root) {
    this.view = liveView(root, () => JSON.stringify(state.achievements), (r) => {
      const done = CONFIG.achievements.filter((a) => state.achievements[a.id]).length;
      r.append(el("div", "qhead", `<h2 class="h">Succès</h2><span class="qcount">${done} / ${CONFIG.achievements.length}</span>`));
      for (const a of CONFIG.achievements) {
        const ok = !!state.achievements[a.id];
        r.append(el("div", "card ach" + (ok ? " got" : ""), `<span class="medal">${ok ? "OK" : "--"}</span><span class="cinfo"><b>${a.label}</b><span class="sdesc">${a.desc}</span><span class="kind">Bonus : ${rewardText(a.reward)}</span></span>`));
      }
    });
  },
  update() { this.view.update(); },
};
