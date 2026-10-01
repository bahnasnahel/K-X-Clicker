// Bonus dore : un objet dore et brillant passe derriere la fenetre du bureau (pigeon, drone, avion avec banderole).
// Le joueur a quelques secondes pour taper la fenetre. Tout passe par des toasts et des pastilles : le jeu ne s'arrete pas.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { deskFx, DESK } from "./render.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { el, fmt } from "./util.js";
import { incomePerSec } from "./clients.js";
import { gainMoney } from "./fx.js";

const G = CONFIG.golden;
const rnd = (r) => r[0] + Math.random() * (r[1] - r[0]);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let obj = null;

// duree de presence : 8 s, +1 s tous les 5 niveaux de Jadd (s'il est recrute)
const life = () => G.lifeSec + (state.team.jadd.on ? Math.floor(state.team.jadd.lvl / G.jaddBonusEvery) : 0);

function schedule() { state.golden.next = state.stats.playSeconds + rnd(G.everySec); }

function tick(dt) {
  const gd = state.golden, now = state.stats.playSeconds;
  if (gd.bonuses.length && gd.bonuses.some((b) => b.until <= now)) gd.bonuses = gd.bonuses.filter((b) => b.until > now);
  if (!state.flags.clients || !state.settings.tutorialDone) return;               // pas pendant la decouverte
  if (!gd.next) schedule();
  if (obj) {
    obj.age += dt;
    deskFx.golden = { kind: obj.kind, p: Math.min(1, obj.age / obj.life) };
    if (obj.age >= obj.life) { obj = null; deskFx.golden = null; schedule(); }     // raté : il repart
    return;
  }
  if (now >= gd.next) { obj = { kind: pick(G.kinds), age: 0, life: life() }; sfx.ok(); }
}

// Le joueur tape la fenetre : si un objet dore est la, il gagne un bonus au hasard.
export function grabGolden() {
  if (!obj) return false;
  obj = null; deskFx.golden = null; schedule();
  const now = state.stats.playSeconds;
  let r = Math.random() * G.bonuses.reduce((s, b) => s + b.w, 0), b = G.bonuses[0];
  for (const x of G.bonuses) { if ((r -= x.w) < 0) { b = x; break; } }
  if (b.id === "money") {
    const euro = Math.max(b.minEuro, Math.max(incomePerSec(), state.flow.euro) * b.incomeSec);
    gainMoney(euro);
    toast(`Bonus doré : ${fmt(euro)} EUR`);
  } else if (b.id === "calm") {
    state.stress = 0; sfx.unlock();
    toast("Bonus doré : stress à zéro");
  } else {
    const have = state.golden.bonuses.find((x) => x.kind === b.id);
    if (have) have.until = now + b.durSec; else state.golden.bonuses.push({ kind: b.id, mult: b.mult, until: now + b.durSec });
    sfx.unlock();
    toast(`Bonus doré : ${b.label} pendant ${b.durSec} s`);
  }
  return true;
}

// Le tap est-il sur la fenetre du bureau ? (zone agrandie : au moins 44 px)
export function hitWindow(x, y, canvas) {
  const r = canvas.getBoundingClientRect(), s = Math.max(r.width / DESK.W, r.height / DESK.H);
  const w = DESK.win, cx = r.left + (r.width - DESK.W * s) / 2 + (w.x + w.w / 2) * s, cy = r.top + (r.height - DESK.H * s) * DESK.posY + (w.y + w.h / 2) * s;
  return Math.abs(x - cx) <= Math.max((w.w * s) / 2 + 6, 24) && Math.abs(y - cy) <= Math.max((w.h * s) / 2 + 6, 24);
}
export const goldenHere = () => !!obj;

// ---- pastilles des bonus en cours ----
let pills, lastPills = "";
export function updatePills() {
  if (!pills) { pills = el("div"); pills.id = "bpills"; document.querySelector(".deskwrap").append(pills); }
  const now = state.stats.playSeconds;
  const list = state.golden.bonuses.filter((b) => b.until > now).map((b) => `${CONFIG.golden.bonuses.find((x) => x.id === b.kind).label} · ${Math.ceil(b.until - now)} s`);
  const sig = list.join("|");
  if (sig === lastPills) return;
  lastPills = sig;
  pills.replaceChildren(...list.map((t) => el("span", "bpill", t)));
}

export function initGolden() { addSystem(tick); }
