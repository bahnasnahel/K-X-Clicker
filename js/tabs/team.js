import { el } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";

export const portrait = (id, cls = "") =>
  `<span class="frame ${cls}"><img src="assets/photos/${id}.webp" alt="" width="256" height="256" decoding="async"></span>`;

export default {
  id: "team", label: "Équipe", icon: "team",
  mount(root) {
    root.append(el("h2", "h", "L'équipe K'X"));
    this.cards = {};
    for (const [id, p] of Object.entries(CONFIG.team)) {
      const c = el("button", "card person");
      c.innerHTML = `${portrait(id)}<span class="pt"><span class="nm">${p.name}</span><span class="rl">${p.role}</span><span class="ds">${p.desc}</span><span class="st"></span></span>`;
      c.onclick = () => sfx.tap();
      root.append(c);
      this.cards[id] = c;
    }
  },
  update() {
    for (const [id, c] of Object.entries(this.cards)) {
      const on = !!state.team[id];
      c.classList.toggle("on", id === "nahel");
      c.querySelector(".st").textContent = on ? "Dans l'équipe" : "À recruter";
    }
  },
};
