// Panneaux du haut de l'ecran : « Quetes » et « Hackers ». Un petit bouton en haut a droite du bureau ouvre une feuille
// qui NE met PAS le jeu en pause (fenetre « live »). Le contenu se met a jour en direct.
import { el, liveView } from "./util.js";
import { state } from "./state.js";
import { icon } from "./icons.js";
import { modal } from "./modal.js";
import { sfx } from "./audio.js";
import { renderMissions, missionsSig } from "./missions.js";
import { renderHackers, hackersSig } from "./hackers.js";

const PANELS = [
  { id: "quests",  label: "Quêtes",  icon: "quest",  flag: "clients",  sig: missionsSig, render: renderMissions, badge: () => state.missions.list.filter((m) => m.done).length },
  { id: "hackers", label: "Hackers", icon: "hacker", flag: "security", sig: hackersSig,  render: renderHackers,  badge: () => state.enemies.length },
];
const btns = {};
let open = null;

export function initPanels() {
  const bar = el("div", "sidebtns");
  for (const p of PANELS) {
    const b = el("button", "sidebtn", `${icon(p.icon, 18)}<span>${p.label}</span><i class="sbn"></i>`);
    b.setAttribute("aria-label", p.label);
    b.onclick = () => openPanel(p);
    bar.append(b);
    btns[p.id] = b;
  }
  document.querySelector(".deskwrap").append(bar);
}

function openPanel(p) {
  if (open) return;
  sfx.tap();
  modal((box, close) => {
    box.classList.add("sheet");
    const head = el("div", "qhead", `<h2 class="h">${p.label}</h2>`);
    const cl = el("button", "btn small-btn ghost", "Fermer");
    cl.onclick = () => close(true);
    head.append(cl);
    const body = el("div");
    box.append(head, body);
    open = { view: liveView(body, p.sig, p.render) };
    open.view.update();
  }, { live: true }).then(() => { open = null; });
}

// appele a chaque image : boutons visibles selon la progression, pastille de compte, contenu en direct
export function updatePanels() {
  for (const p of PANELS) {
    const b = btns[p.id];
    b.hidden = !state.flags[p.flag];
    const n = b.hidden ? 0 : p.badge(), dot = b.querySelector(".sbn");
    const t = n ? String(n) : "";
    if (dot.textContent !== t) { dot.textContent = t; dot.style.display = n ? "grid" : "none"; }
  }
  if (open) open.view.update();
}
