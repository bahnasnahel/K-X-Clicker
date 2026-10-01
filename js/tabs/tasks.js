import { el, fmt } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";
import { icon } from "../icons.js";
import { advanceTask, mistake, holdMs } from "../tasks.js";
import { findClient } from "../clients.js";
import { activeTypes, auto, status } from "../workflows.js";

const HINT = {
  drag:   "Glisse la facture vers le bon dossier.",
  tap:    "Lis le message, puis envoie-le.",
  cells:  "Tape les 3 cases qui brillent.",
  hold:   "Maintiens ton doigt appuyé pour rédiger.",
  choice: "Additionne les lignes, puis tape le bon total.",
};

let head, capEl, stage, fx, list, autoEl;
let focusId = null, stageId = null, listSig = "";

const byId = (id) => state.queue.find((t) => t.id === id);

// ---------- Fin de tache + gains affiches ----------
function finish(t, node) {
  const gain = advanceTask(t.id);
  if (!gain) return;
  if (gain.step) {                       // tache difficile : il reste des etapes
    sfx.ok();
    const f = el("div", "float step", `Étape ${gain.step} faite`);
    fx.append(f); setTimeout(() => f.remove(), 900);
    stageId = null;                      // reconstruit avec les nouvelles donnees
    return;
  }
  sfx.coin();
  const i = state.queue.length ? 0 : -1;
  focusId = i >= 0 ? state.queue[0].id : null;
  stageId = null;
  const f = el("div", "float", `+${fmt(gain.euro)} EUR`);
  fx.append(f);
  setTimeout(() => f.remove(), 900);
  if (node) node.classList.add("ok");
}

function shake(node) {
  node.classList.remove("shake"); void node.offsetWidth; node.classList.add("shake");
}

// ---------- Gestes ----------
function buildFacture(t) {
  const w = el("div", "g-facture");
  const card = el("div", "doc", `<b>FACTURE</b><span class="l1">${t.data.label}</span><span class="l2">${t.data.amount} EUR</span><span class="dragme">Glisse-moi</span>`);
  const folders = el("div", "folders");
  const fEls = Object.entries(CONFIG.content.folders).map(([id, label]) => {
    const f = el("div", "folder", `<i></i><span>${label}</span>`);
    f.dataset.folder = id; folders.append(f); return f;
  });
  const at = (x, y) => fEls.find((f) => { const r = f.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
  let drag = false, sx = 0, sy = 0;
  card.addEventListener("pointerdown", (e) => {
    drag = true; sx = e.clientX; sy = e.clientY;
    card.setPointerCapture(e.pointerId); card.classList.add("drag"); sfx.tap();
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 25}deg)`;
    const over = at(e.clientX, e.clientY);
    fEls.forEach((f) => f.classList.toggle("hover", f === over));
  });
  const end = (e, cancelled) => {
    if (!drag) return;
    drag = false; card.classList.remove("drag");
    const f = cancelled ? null : at(e.clientX, e.clientY);
    fEls.forEach((x) => x.classList.remove("hover"));
    card.style.transform = "";
    if (!f) return;
    if (f.dataset.folder === t.data.folder) finish(t, card);
    else { mistake(); shake(card); }
  };
  card.addEventListener("pointerup", (e) => end(e, false));
  card.addEventListener("pointercancel", (e) => end(e, true));
  w.append(card, folders);
  return w;
}

function buildRelance(t) {
  const w = el("div", "g-relance");
  w.append(el("div", "mail", `<span class="to">À : ${t.data.who}</span><span class="sub">Objet : Relance</span><p>Bonjour, ${t.data.txt} Pouvez-vous nous confirmer la suite ?</p>`));
  const b = el("button", "btn big", "Envoyer");
  b.onclick = () => finish(t, w);
  w.append(b);
  return w;
}

function buildExcel(t) {
  const w = el("div", "g-excel");
  w.append(el("div", "sheetname", t.data.title));
  const grid = el("div", "grid");
  let left = t.data.cells.length;
  for (let i = 0; i < 9; i++) {
    const c = el("button", "cell" + (t.data.cells.includes(i) ? " lit" : ""));
    c.setAttribute("aria-label", "Case " + (i + 1));
    c.onclick = () => {
      if (c.classList.contains("done")) return;
      if (t.data.cells.includes(i)) {
        c.classList.remove("lit"); c.classList.add("done"); sfx.ok();
        if (--left === 0) finish(t, w);
      } else { mistake(); shake(c); }
    };
    grid.append(c);
  }
  w.append(grid);
  return w;
}

function buildHold(t) {
  const ms = holdMs(t.type);
  const w = el("div", "g-rapport");
  w.append(el("div", "doc wide", `<b>${t.type === "contrat" ? "CONTRAT" : "RAPPORT"}</b><span class="l1">${t.data.title}</span><span class="l2 lines"><i></i><i></i><i></i></span>`));
  const b = el("button", "hold", `<i class="fill"></i><span>${t.type === "contrat" ? "Maintenir pour signer" : "Maintenir pour rédiger"}</span>`);
  const fill = b.querySelector(".fill");
  let timer = null;
  const stop = () => {
    clearTimeout(timer); timer = null;
    fill.style.transition = "none"; fill.style.width = "0";
    b.classList.remove("holding");
  };
  b.addEventListener("pointerdown", (e) => {
    if (timer) return;
    b.setPointerCapture(e.pointerId); b.classList.add("holding"); sfx.tap();
    fill.style.transition = "none"; fill.style.width = "0"; void fill.offsetWidth;
    fill.style.transition = `width ${ms}ms linear`; fill.style.width = "100%";
    timer = setTimeout(() => { timer = null; finish(t, w); }, ms);
  });
  b.addEventListener("pointerup", stop);
  b.addEventListener("pointercancel", stop);
  b.addEventListener("contextmenu", (e) => e.preventDefault());
  w.append(b);
  return w;
}

function buildChoice(t) {
  const w = el("div", "g-choice");
  const rows = t.data.lines.map((x) => `<span class="dl"><i>${x.l}</i><i>${x.a} EUR</i></span>`).join("");
  w.append(el("div", "doc wide", `<b>DEVIS</b><span class="l1">${t.data.title}</span>${rows}`));
  const opts = el("div", "opts");
  t.data.options.forEach((v) => {
    const b = el("button", "btn opt", `${v} EUR`);
    b.onclick = () => { if (v === t.data.answer) finish(t, w); else { mistake(); shake(b); } };
    opts.append(b);
  });
  w.append(opts);
  return w;
}

const BUILD = { drag: buildFacture, tap: buildRelance, cells: buildExcel, hold: buildHold, choice: buildChoice };

function buildStage(t) {
  stage.innerHTML = "";
  if (!t) {
    stage.append(el("div", "empty", "Boîte vide.<br><small>Respire, les tâches arrivent.</small>"));
    return;
  }
  const cfg = CONFIG.tasks[t.type];
  stage.append(
    el("div", "stitle", `<span class="t-${t.type}">${icon(t.type, 20)}</span><span>${cfg.label}</span>${t.d > 1 ? `<span class="dpill">Difficulté ${t.d}${t.steps > 1 ? ` · étape ${(t.step || 0) + 1}/${t.steps}` : ""}</span>` : ""}`),
    el("p", "shint", t.client != null && findClient(t.client) ? `Pour ${findClient(t.client).name}. ${HINT[cfg.gesture]}` : HINT[cfg.gesture]),
    BUILD[cfg.gesture](t)
  );
}

function buildList() {
  list.innerHTML = "";
  for (const t of state.queue) {
    const b = el("button", "chip t-" + t.type + (t.id === focusId ? " sel" : ""), icon(t.type, 24));
    b.setAttribute("aria-label", CONFIG.tasks[t.type].label);
    b.onclick = () => { focusId = t.id; sfx.tap(); };
    list.append(b);
  }
}

export default {
  id: "tasks", label: "Tâches", icon: "tasks",
  mount(root) {
    head = el("div", "qhead", `<h2 class="h">Boîte de tâches</h2><span class="qcount"></span>`);
    capEl = head.querySelector(".qcount");
    stage = el("div", "stage");
    fx = el("div", "fxlayer");
    const wrap = el("div", "stagewrap"); wrap.append(stage, fx);
    list = el("div", "qlist");
    autoEl = el("p", "autoline");
    root.append(head, wrap, el("p", "qlabel", "En attente"), list, autoEl);
  },
  update() {
    const q = state.queue;
    if (!byId(focusId)) { focusId = q.length ? q[0].id : null; stageId = null; }
    const cap = CONFIG.queue.capacity;
    const txt = `${q.length} / ${cap}`;
    if (capEl.textContent !== txt) capEl.textContent = txt;
    capEl.classList.toggle("over", q.length > cap);

    const at = activeTypes();
    const autoTxt = at.length ? "Automatisé : " + at.map((k) => `${CONFIG.tasks[k].label.split(" ")[0]} (${auto(k).backlog.length}${status(k) === "ok" ? "" : ", arrêté"})`).join(" · ") : "";
    if (autoEl.textContent !== autoTxt) autoEl.textContent = autoTxt;

    const sig = q.map((t) => t.id).join(",") + "|" + focusId;
    if (sig !== listSig) { listSig = sig; buildList(); }
    if (stageId !== focusId || (focusId === null && !stage.firstChild)) {
      stageId = focusId;
      buildStage(byId(focusId));
    }
  },
};
