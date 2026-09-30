import { el, fmt, fmtHours } from "./util.js";
import { CONFIG } from "./config.js";
import { state, save, reset, deskLevel } from "./state.js";
import { icon } from "./icons.js";
import { sfx, setMuted } from "./audio.js";
import { stubTab } from "./tabs/stub.js";
import tasks from "./tabs/tasks.js";
import team from "./tabs/team.js";

const tabs = [
  tasks,
  stubTab("workflows", "Workflows", "workflows", "Éditeur de workflows", "Automatise tes tâches en assemblant des blocs. Bientôt disponible."),
  stubTab("clients", "Clients", "clients", "Clients", "Signe des clients pour des revenus passifs. Bientôt disponible."),
  team,
  stubTab("agency", "Agence", "agency", "Nouvelle agence", "Ouvre K'X dans une nouvelle ville. Bientôt disponible."),
  stubTab("success", "Succès", "trophy", "Succès", "Une vingtaine de succès à débloquer. Bientôt disponible."),
];

let current = "tasks";
const panels = {};
const $ = (s) => document.querySelector(s);
const last = {};   // valeurs deja affichees, pour ne toucher au DOM que si ca change

function setText(key, node, v) { if (last[key] !== v) { last[key] = v; node.textContent = v; } }

export function initUI() {
  // barre d'onglets + panneaux
  const nav = $("#tabbar"), main = $("#main");
  for (const t of tabs) {
    const b = el("button", "tab", `${icon(t.icon, 22)}<span>${t.label}</span>`);
    b.dataset.tab = t.id;
    b.setAttribute("role", "tab");
    b.onclick = () => showTab(t.id);
    nav.append(b);
    const p = el("section", "panel");
    p.id = "panel-" + t.id; p.hidden = true;
    main.append(p);
    panels[t.id] = p;
    t.mount(p);
  }
  showTab(current, true);

  // boutons d'entete
  $("#btn-sound").innerHTML = icon("sound", 22);
  $("#btn-gear").innerHTML = icon("gear", 22);
  $("#btn-sound").onclick = () => { setMuted(!state.settings.muted); sfx.tap(); syncSound(); save(); };
  $("#btn-gear").onclick = openSettings;
  syncSound();
}

function syncSound() {
  const b = $("#btn-sound");
  b.classList.toggle("off", state.settings.muted);
  b.setAttribute("aria-label", state.settings.muted ? "Activer le son" : "Couper le son");
}

export function showTab(id, silent) {
  current = id;
  if (!silent) sfx.tab();
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === id));
  for (const [k, p] of Object.entries(panels)) p.hidden = k !== id;
  $("#main").scrollTop = 0;
}

// appele a chaque image
export function updateUI() {
  setText("money", $("#c-money"), fmt(state.money));
  setText("hours", $("#c-hours"), fmtHours(state.hoursSaved));
  setText("stress", $("#c-stress"), Math.round(state.stress) + " %");
  setText("heat", $("#c-heat"), Math.round(state.heat) + " %");
  $("#bar-stress").style.width = state.stress + "%";
  $("#bar-heat").style.width = state.heat + "%";
  $("#stress-cell").classList.toggle("hot", state.stress >= 100);
  $("#heat-cell").classList.toggle("hot", state.heat >= 80);
  setText("deskLabel", $("#desk-label"), CONFIG.desk[deskLevel()].label);
  const t = tabs.find((x) => x.id === current);
  if (t) t.update(state);
}

// ---------- Fenetres modales ----------
function modal(build) {
  return new Promise((resolve) => {
    const ov = el("div", "overlay");
    const box = el("div", "modal");
    const close = (v) => { ov.remove(); resolve(v); };
    build(box, close);
    ov.append(box);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(null); });
    document.body.append(ov);
  });
}

export function confirmDialog(title, text, okLabel = "Confirmer") {
  return modal((box, close) => {
    box.append(el("h3", "h", title), el("p", "", text));
    const row = el("div", "row");
    const no = el("button", "btn ghost", "Annuler"), ok = el("button", "btn danger", okLabel);
    no.onclick = () => close(false); ok.onclick = () => close(true);
    row.append(no, ok); box.append(row);
  });
}

export function infoDialog(title, html, okLabel = "OK") {
  return modal((box, close) => {
    box.append(el("h3", "h", title));
    const d = el("div", "", html); box.append(d);
    const ok = el("button", "btn", okLabel); ok.onclick = () => close(true);
    box.append(ok);
  });
}

function openSettings() {
  sfx.tap();
  modal((box, close) => {
    box.append(el("h3", "h", "Réglages"));
    const snd = el("button", "btn ghost", state.settings.muted ? "Son : coupé" : "Son : activé");
    snd.onclick = () => { setMuted(!state.settings.muted); snd.textContent = state.settings.muted ? "Son : coupé" : "Son : activé"; syncSound(); save(); sfx.tap(); };
    const rs = el("button", "btn danger", "Réinitialiser la partie");
    rs.onclick = async () => {
      const ok = await confirmDialog("Tout effacer ?", "Ta progression (argent, clients, workflows, agences) sera définitivement perdue.", "Effacer");
      if (ok) { reset(); location.reload(); }
    };
    const cl = el("button", "btn", "Fermer"); cl.onclick = () => close(true);
    box.append(snd, rs, cl, el("p", "muted small", "K'X Clicker V1 · " + CONFIG.slogan));
  });
}
