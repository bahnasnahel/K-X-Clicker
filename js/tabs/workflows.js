import { el, fmt, fmt1, fmt2, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { icon } from "../icons.js";
import { sfx } from "../audio.js";
import { modal } from "../modal.js";
import { availableTypes } from "../tasks.js";
import { serverCost, buyServer } from "../crew.js";
import {
  wf, setSlot, rate, status, isActive, hasCheck, actionSlots, blockLevel, blockUnlocked, blockFits,
  buyCost, upgradeCost, buyOrUpgrade, heatFactor,
} from "../workflows.js";

const K = CONFIG.blocks, W = CONFIG.workflow;
const KIND = { trigger: "Déclencheur", action: "Action", check: "Vérification" };
const STATUS = { off: "Inactif", ok: "Actif", crashed: "Planté", paused: "Attaqué" };

const canBuy = (id) => {
  const l = blockLevel(id);
  return blockUnlocked(id) && l < W.maxBlockLevel && state.hoursSaved >= (l === 0 ? buyCost(id) : upgradeCost(id));
};

function pick(type, slot, kind) {
  modal((box, close) => {
    box.append(el("h3", "h", KIND[kind]));
    const w = wf(type);
    const cur = slot === "trigger" ? w.trigger : slot === "check" ? w.check : w.actions[slot];
    const ids = Object.keys(K).filter((id) => K[id].kind === kind && blockLevel(id) > 0 && blockFits(id, type));
    if (cur) {
      const b = el("button", "btn ghost", "Vider l'emplacement");
      b.onclick = () => { setSlot(type, slot, null); sfx.tap(); close(); };
      box.append(b);
    }
    ids.forEach((id) => {
      const b = el("button", "opt-block" + (id === cur ? " cur" : ""), `<b>${K[id].label}</b><span>Niv. ${blockLevel(id)} · ${K[id].desc}</span>`);
      b.onclick = () => { setSlot(type, slot, id); sfx.ok(); close(); };
      box.append(b);
    });
    if (!ids.length) box.append(el("p", "muted", "Aucun bloc disponible. Achète-en dans la boutique, plus bas."));
    const c = el("button", "btn", "Fermer"); c.onclick = () => close(); box.append(c);
  });
}

function slotTile(type, slot, kind, id) {
  const b = el("button", "slot" + (id ? " filled" : ""),
    `<small>${KIND[kind]}</small>` + (id ? `<b>${K[id].label}</b><em>Niv. ${blockLevel(id)}</em>` : `<b class="plus">+</b>`));
  b.onclick = () => { sfx.tap(); pick(type, slot, kind); };
  return b;
}

export default {
  id: "workflows", label: "Workflows", icon: "workflows",
  badge: () => false,
  mount(root) {
    const sig = () => {
      const types = availableTypes();
      return JSON.stringify([
        types, types.map((t) => { const w = state.workflows[t]; return w ? [w.trigger, w.actions.slice(0, actionSlots()), w.check] : 0; }),
        state.blocks, Object.keys(K).map(canBuy), state.team.yanis.on, state.servers, state.money >= serverCost(), actionSlots(),
      ]);
    };
    this.view = liveView(root, sig, (r, live) => {
      r.append(el("h2", "h", "Workflows"));

      // environnement : serveurs et chaleur
      const env = el("div", "card envcard");
      const info = el("div", "envinfo", `<b>Bureau</b><span class="envline"></span>`);
      const line = info.querySelector(".envline");
      live(() => setText(line, `Chaleur ${Math.round(state.heat)} % · vitesse ${Math.round(heatFactor() * 100)} % · ${state.servers}/${CONFIG.servers.max} serveur${state.servers > 1 ? "s" : ""}`));
      env.append(info);
      if (state.servers < CONFIG.servers.max) {
        const b = el("button", "btn small-btn", `Serveur<br><small>${fmt(serverCost())} EUR</small>`);
        b.disabled = state.money < serverCost();
        b.onclick = () => buyServer();
        env.append(b);
      }
      r.append(env);

      // un workflow par type de tache
      const nAct = actionSlots();
      for (const type of availableTypes()) {
        const w = wf(type);
        const card = el("div", "card wfcard");
        const head = el("div", "wfhead", `<span class="t-${type}">${icon(type, 22)}</span><b>${CONFIG.tasks[type].label}</b><span class="pill"></span>`);
        const pill = head.querySelector(".pill");
        const stats = el("div", "wfstats"), note = el("div", "wfnote");
        const slots = el("div", "slots");
        slots.append(slotTile(type, "trigger", "trigger", w.trigger));
        for (let i = 0; i < nAct; i++) slots.append(slotTile(type, i, "action", w.actions[i] || null));
        slots.append(slotTile(type, "check", "check", w.check));
        card.append(head, slots, stats, note);
        live(() => {
          const st = status(type);
          setText(pill, STATUS[st]); pill.className = "pill st-" + st;
          setText(stats, isActive(type) ? `${fmt2(rate(type) * 60)} tâches/min · ${w.backlog.length} en attente` : "");
          setText(note, !isActive(type) ? "Place un déclencheur et une action pour démarrer." :
            hasCheck(type) ? "Vérification active : aucun bug." : `Sans vérification : plus rapide, mais ${Math.round(W.bugChance * 100)} % de risque de bug par tâche.`);
        });
        r.append(card);
      }

      // boutique de blocs
      r.append(el("p", "qlabel", "Boutique de blocs (heures gagnées)"));
      for (const id of Object.keys(K)) {
        const b = K[id], lvl = blockLevel(id), locked = !blockUnlocked(id);
        const fits = b.kind === "action" ? (b.for === "*" ? "Tous types" : b.for.map((t) => CONFIG.tasks[t].label.split(" ")[0]).join(", ")) : "Tous types";
        const row = el("div", "card shoprow" + (locked ? " locked" : ""));
        row.append(el("div", "sinfo", `<b>${b.label}</b><span class="kind">${KIND[b.kind]} · ${fits}${lvl ? " · Niv. " + lvl : ""}</span><span class="sdesc">${b.desc}</span>`));
        let label;
        if (locked) label = `Débloqué par ${CONFIG.team[b.needs].name}`;
        else if (lvl >= W.maxBlockLevel) label = "Niveau max";
        else label = lvl === 0 ? `Acheter<br><small>${buyCost(id)} h</small>` : `Niv. ${lvl + 1}<br><small>${upgradeCost(id)} h</small>`;
        const btn = el("button", "btn small-btn", label);
        btn.disabled = locked || lvl >= W.maxBlockLevel || !canBuy(id);
        btn.onclick = () => buyOrUpgrade(id);
        row.append(btn);
        r.append(row);
      }
    });
  },
  update() { this.view.update(); },
};
