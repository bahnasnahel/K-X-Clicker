import { el, fmt, fmtHours, setText } from "./util.js";
import { CONFIG } from "./config.js";
import { state, save, reset, deskLevel } from "./state.js";
import { icon } from "./icons.js";
import { sfx } from "./audio.js";
import { setMuted } from "./audio.js";
import { modal, confirmDialog, infoDialog } from "./modal.js";
import { hitAttack } from "./crew.js";
import { startTutorial } from "./tutorial.js";
import { openCheat, cheatActive, cheatLabel } from "./cheat.js";
import tasks from "./tabs/tasks.js";
import workflows from "./tabs/workflows.js";
import clients from "./tabs/clients.js";
import team from "./tabs/team.js";
import agency from "./tabs/agency.js";
import success from "./tabs/success.js";

const tabs = [tasks, clients, team, workflows, agency, success];
const isVisible = (t) => t.id === "tasks" || !!state.flags[t.id];
let current = "tasks";
const panels = {}, buttons = {};
const $ = (s) => document.querySelector(s);

export function initUI() {
  const nav = $("#tabbar"), main = $("#main");
  for (const t of tabs) {
    const b = el("button", "tab", `${icon(t.icon, 22)}<span>${t.label}</span><i class="dot"></i>`);
    b.dataset.tab = t.id;
    b.setAttribute("role", "tab");
    b.onclick = () => showTab(t.id);
    nav.append(b);
    buttons[t.id] = b;
    const p = el("section", "panel");
    p.id = "panel-" + t.id; p.hidden = true;
    main.append(p);
    panels[t.id] = p;
    t.mount(p);
  }
  showTab(current, true);

  // « ? » : explication courte de chaque compteur
  document.querySelectorAll(".cnt").forEach((c) => {
    c.onclick = () => { const [t, txt] = CONFIG.help[c.dataset.help]; sfx.tap(); infoDialog(t, `<p>${txt}</p>`, "Compris"); };
  });

  $("#btn-sound").innerHTML = icon("sound", 22);
  $("#btn-gear").innerHTML = icon("gear", 22);
  $("#btn-sound").onclick = () => { setMuted(!state.settings.muted); sfx.tap(); syncSound(); save(); };
  $("#btn-gear").onclick = openSettings;
  syncSound();

  // alerte d'attaque (visible depuis tous les onglets)
  const al = el("button", "alert hidden", `<b>ATTAQUE</b><span class="atxt"></span><i class="abar"><b></b></i>`);
  al.onclick = () => hitAttack();
  al.addEventListener("pointerdown", (e) => e.preventDefault());
  document.body.append(al);
  ui.alert = al;

  // pastille visible quand le mode triche est actif (tape pour l'ouvrir)
  const ch = el("button", "cheatbadge hidden");
  ch.onclick = openCheat;
  $(".deskwrap").append(ch);
  ui.cheat = ch;
}
const ui = {};

function syncSound() {
  const b = $("#btn-sound");
  b.classList.toggle("off", state.settings.muted);
  b.setAttribute("aria-label", state.settings.muted ? "Activer le son" : "Couper le son");
}

export function showTab(id, silent) {
  current = id;
  state.seen[id] = true;
  if (!silent) sfx.tab();
  for (const [k, b] of Object.entries(buttons)) b.classList.toggle("on", k === id);
  for (const [k, p] of Object.entries(panels)) p.hidden = k !== id;
  $("#main").scrollTop = 0;
}

const last = {};
function set(key, node, v) { if (last[key] !== v) { last[key] = v; node.textContent = v; } }

// appele a chaque image
export function updateUI() {
  set("money", $("#c-money"), fmt(state.money));
  set("hours", $("#c-hours"), fmtHours(state.hoursSaved));
  set("stress", $("#c-stress"), Math.round(state.stress) + " %");
  set("heat", $("#c-heat"), Math.round(state.heat) + " %");
  $("#cell-hours").hidden = !state.flags.hours;
  $("#stress-cell").hidden = !state.flags.stress;
  $("#heat-cell").hidden = !state.flags.heat;
  $("#bar-stress").style.width = state.stress + "%";
  $("#bar-heat").style.width = state.heat + "%";
  $("#stress-cell").classList.toggle("hot", state.stress >= 100);
  $("#heat-cell").classList.toggle("hot", state.heat >= 80);
  set("deskLabel", $("#desk-label"), CONFIG.prestige.cities[state.city]);

  // les onglets apparaissent au fur et a mesure ; la barre n'existe qu'a partir de deux onglets
  let visible = 0;
  for (const x of tabs) {
    const v = isVisible(x);
    if (v) visible++;
    buttons[x.id].hidden = !v;
    if (!v && current === x.id) showTab("tasks", true);
  }
  document.body.classList.toggle("notabs", visible <= 1);

  const t = tabs.find((x) => x.id === current);
  if (t) t.update(state);
  for (const x of tabs) {
    if (!isVisible(x) || x.id === current) { buttons[x.id].classList.remove("badged"); continue; }
    buttons[x.id].classList.toggle("badged", !state.seen[x.id] || !!(x.badge && x.badge()));
  }

  const on = cheatActive();
  ui.cheat.classList.toggle("hidden", !on);
  if (on) set("cheat", ui.cheat, cheatLabel());

  const a = state.attack;
  ui.alert.classList.toggle("hidden", !a);
  if (a) {
    set("atk", ui.alert.querySelector(".atxt"), `${CONFIG.tasks[a.type].label} : tape pour repousser (${a.hp})`);
    ui.alert.querySelector(".abar b").style.width = Math.max(0, ((a.deadline - state.stats.playSeconds) / CONFIG.attacks.windowSec) * 100) + "%";
  }
}

function openSettings() {
  sfx.tap();
  modal((box, close) => {
    box.append(el("h3", "h", "Réglages"));
    const snd = el("button", "btn ghost", state.settings.muted ? "Son : coupé" : "Son : activé");
    snd.onclick = () => { setMuted(!state.settings.muted); snd.textContent = state.settings.muted ? "Son : coupé" : "Son : activé"; syncSound(); save(); sfx.tap(); };
    const tu = el("button", "btn ghost", "Revoir le tutoriel");
    tu.onclick = () => { close(); startTutorial(); };
    const ct = el("button", "btn ghost", "Mode triche (tests)");
    ct.onclick = () => { close(); openCheat(); };
    const rs = el("button", "btn danger", "Réinitialiser la partie");
    rs.onclick = async () => {
      const ok = await confirmDialog("Tout effacer ?", "Ta progression (argent, clients, workflows, agences) sera définitivement perdue.", "Effacer");
      if (ok) { reset(); location.reload(); }
    };
    const cl = el("button", "btn", "Fermer"); cl.onclick = () => close(true);
    box.append(snd, tu, ct, rs, cl, el("p", "muted small", "K'X Clicker V1 · " + CONFIG.slogan));
  });
}
