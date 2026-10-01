// Remerciements : de temps en temps, un client tres content envoie une petite bulle avec une prime a encaisser d'un tap.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { clientIncome } from "./clients.js";
import { avatar } from "./avatar.js";
import { gainMoney, fmtShort } from "./fx.js";
import { el } from "./util.js";

const T = CONFIG.thanks;
const rnd = (r) => r[0] + Math.random() * (r[1] - r[0]);
let box, cur = null, wait = rnd(T.everySec), lastId = null;

function close() { if (cur) { cur.node.remove(); cur = null; } }

function show(c) {
  if (!box) { box = el("div"); box.id = "thanks"; document.body.append(box); }
  const amount = Math.max(T.minBonus, Math.round(clientIncome(c) * T.bonusSec));
  const pic = avatar({}, "", "c:" + c.id) || `<span class="frame ini tier3"><b>${c.name[0]}</b></span>`;
  const node = el("button", "bubble thanks", `${pic}<p><b>${c.name}</b>est ravie de votre travail !<span class="prime">Prime : +${fmtShort(amount)} · tape pour encaisser</span></p>`);
  node.onclick = () => { gainMoney(amount); close(); };
  box.append(node);
  cur = { node, id: c.id, left: T.lifeSec };
  lastId = c.id;
}

function tick(dt) {
  if (cur) {
    cur.left -= dt;
    if (cur.left <= 0 || !state.clients.some((c) => c.id === cur.id)) close();
    return;
  }
  if (!state.flags.clients) return;
  wait -= dt;
  if (wait > 0) return;
  wait = rnd(T.everySec);
  const happy = state.clients.filter((c) => c.sat >= T.minSat && c.id !== lastId);
  if (happy.length) show(happy[Math.floor(Math.random() * happy.length)]);
}

export function initThanks() { addSystem(tick); }
