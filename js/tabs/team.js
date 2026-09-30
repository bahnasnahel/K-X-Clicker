import { el, fmt, liveView } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";
import { portrait, activePerson } from "../bubbles.js";
import { recruit, upgrade, upgradeCost, isVisible, jaddTap, jaddEvery, noahBlock } from "../crew.js";
import { actionSlots } from "../workflows.js";

const T = CONFIG.team;
const effect = (id) => {
  const m = state.team[id];
  if (id === "nahel") return `Niveau ${m.lvl} · gains manuels +${Math.round(m.lvl * T.nahel.manualBonus * 100)} %`;
  if (!m.on) return "";
  if (id === "yanis") return `Niveau ${m.lvl} · workflows +${Math.round(m.lvl * T.yanis.speedBonus * 100)} % · ${actionSlots() + 2} emplacements`;
  if (id === "jadd") return `Niveau ${m.lvl} · une fenêtre toutes les ${Math.round(jaddEvery())} s`;
  if (id === "noah") return `Niveau ${m.lvl} · blocage automatique ${Math.round(noahBlock() * 100)} %`;
};

export default {
  id: "team", label: "Équipe", icon: "team",
  badge: () => ["yanis", "jadd", "noah"].some((id) => !state.team[id].on && isVisible(id) && state.money >= T[id].recruit),
  mount(root) {
    const sig = () => JSON.stringify(Object.keys(T).map((id) => [state.team[id].on, state.team[id].lvl, isVisible(id), state.money >= (state.team[id].on ? upgradeCost(id) : T[id].recruit)]));
    this.cards = {};
    this.view = liveView(root, sig, (r, live) => {
      r.append(el("h2", "h", "L'équipe K'X"));
      this.cards = {};
      for (const id of Object.keys(T)) {
        const cfg = T[id], m = state.team[id], vis = isVisible(id);
        const c = el("div", "card person" + (vis ? "" : " locked"));
        const fx = effect(id);
        c.innerHTML = `${portrait(id)}<span class="pt"><span class="nm">${cfg.name}</span><span class="rl">${cfg.role}</span>
          <span class="ds">${vis ? cfg.desc : `Disponible après ${cfg.unlockHours} h gagnées dans l'agence.`}</span>${fx ? `<span class="fx">${fx}</span>` : ""}<span class="acts"></span></span>`;
        const acts = c.querySelector(".acts");
        if (vis) {
          let b = null;
          if (!m.on) { b = el("button", "btn small-btn wide", `Recruter · ${fmt(cfg.recruit)} EUR`); b.disabled = state.money < cfg.recruit; b.onclick = (e) => { e.stopPropagation(); recruit(id); }; }
          else if (m.lvl < cfg.maxLevel) { b = el("button", "btn small-btn wide", `Améliorer · ${fmt(upgradeCost(id))} EUR`); b.disabled = state.money < upgradeCost(id); b.onclick = (e) => { e.stopPropagation(); upgrade(id); }; }
          else acts.append(el("span", "fx", "Niveau maximum"));
          if (b) acts.append(b);
        }
        c.onclick = () => (id === "jadd" && m.on ? jaddTap() : sfx.tap());
        r.append(c);
        this.cards[id] = c;
      }
    });
  },
  update() {
    this.view.update();
    const a = activePerson() || "nahel";
    for (const [id, c] of Object.entries(this.cards)) c.classList.toggle("on", id === a);
  },
};
