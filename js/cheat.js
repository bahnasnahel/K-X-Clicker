// Mode triche : pour tester vite (vitesse, gains, raccourcis). Ouvert depuis les Reglages.
import { el } from "./util.js";
import { CONFIG } from "./config.js";
import { state, save, freshAgencyFields } from "./state.js";
import { modal } from "./modal.js";
import { toast } from "./toast.js";
import { sfx } from "./audio.js";

const SPEEDS = [1, 2, 5, 10, 50];
const GAINS = [1, 2, 5, 10, 100];

export const cheatActive = () => (state.settings.speed || 1) !== 1 || (state.settings.gain || 1) !== 1;
export const cheatLabel = () => `TRICHE · vitesse x${state.settings.speed} · gains x${state.settings.gain}`;

function segment(title, values, key, prefix, onPick) {
  const wrap = el("div", "cheatrow");
  wrap.append(el("p", "qlabel", title));
  const row = el("div", "seg");
  values.forEach((v) => {
    const b = el("button", "segbtn" + (state.settings[key] === v ? " on" : ""), `${prefix}${v}`);
    b.onclick = () => {
      state.settings[key] = v; save(); sfx.tap();
      row.querySelectorAll(".segbtn").forEach((x) => x.classList.toggle("on", x === b));
      onPick && onPick();
    };
    row.append(b);
  });
  wrap.append(row);
  return wrap;
}

const ACTIONS = [
  ["+1 000 EUR", () => { state.money += 1000; }],
  ["+100 heures", () => { state.hoursSaved += 100; state.hoursRun += 100; state.lifetimeHours += 100; }],
  ["+1 million EUR", () => { state.money += 1000000; }],
  ["+500 heures dans cette agence", () => { state.hoursSaved += 500; state.hoursRun += 500; state.lifetimeHours += 500; }],
  ["Débloquer toutes les agences", () => { for (const c of state.cities) if (!c.unlocked) { c.unlocked = true; } state.cities.forEach((c, i) => { if (!c.data && i !== state.city) c.data = freshAgencyFields(i); }); }],
  ["+50 points de boutique", () => { state.points += 50; state.pointsEarned += 50; }],
  ["Tout débloquer (onglets, types)", () => { for (const u of CONFIG.unlocks) state.flags[u.id] = true; }],
  ["Recruter toute la direction", () => { for (const k of ["yanis", "jadd", "noah"]) state.team[k].on = true; }],
  ["Stress à zéro", () => { state.stress = 0; }],
  ["Bureau au maximum", () => { state.office = CONFIG.office.levels.length - 1; }],
  ["Crédibilité à 100 %", () => { state.credibility = 100; }],
  ["Lancer une attaque", () => { const t = Object.keys(state.auto).find((k) => state.auto[k].level > 0); if (t) state.attack = { type: t, hp: CONFIG.attacks.tapsBase, deadline: state.stats.playSeconds + CONFIG.attacks.windowSec, power: 1 }; else toast("Installe d'abord une automatisation."); }],
];

export function openCheat() {
  modal((box, close) => {
    box.append(el("h3", "h", "Mode triche"));
    box.append(el("p", "muted small", "Pour tester vite. Les réglages de vitesse et de gains restent actifs tant que tu ne les remets pas à x1."));
    box.append(segment("Vitesse du jeu", SPEEDS, "speed", "x"));
    box.append(segment("Multiplicateur de gains", GAINS, "gain", "x"));
    box.append(el("p", "qlabel", "Raccourcis"));
    for (const [label, fn] of ACTIONS) {
      const b = el("button", "btn ghost", label);
      b.onclick = () => { fn(); sfx.ok(); save(); };
      box.append(b);
    }
    const cl = el("button", "btn", "Fermer"); cl.onclick = () => close(true);
    box.append(cl);
  });
}
