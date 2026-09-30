import { el, fmt, fmt1, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { icon } from "../icons.js";
import { infoDialog } from "../modal.js";
import { sfx } from "../audio.js";
import { availableTypes } from "../tasks.js";
import {
  auto, level, rate, status, verifyOn, setVerify, installCost, upgradeCost, needsYanis, atMax,
  canUpgrade, upgrade, installTime, upgrading, upgradeLeft,
} from "../workflows.js";

const A = CONFIG.auto;
const STATUS = { off: "Pas installé", ok: "En marche", crashed: "Planté", paused: "Attaqué" };

// difficulte la plus elevee demandee par les clients actuels pour ce type
const maxDemand = (type) => state.clients.reduce((m, c) => (c.types.includes(type) ? Math.max(m, c.need.skill) : m), 1);

export default {
  id: "workflows", label: "Workflows", icon: "workflows",
  badge: () => availableTypes().some((t) => canUpgrade(t)),
  mount(root) {
    const sig = () => JSON.stringify([
      availableTypes().map((t) => [t, level(t), verifyOn(t), canUpgrade(t), needsYanis(t), maxDemand(t) > level(t)]),
      state.team.yanis.on, availableTypes().map((t) => upgrading(t)),
    ]);
    this.view = liveView(root, sig, (r, live) => {
      const head = el("div", "qhead", `<h2 class="h">Automatisation</h2>`);
      r.append(head);
      r.append(el("p", "muted", "Choisis un type de tâche et améliore son niveau. Plus le niveau est haut, plus c'est rapide, et plus de tâches difficiles sont traitées toutes seules."));

      for (const type of availableTypes()) {
        const L = level(type);
        const card = el("div", "card wfcard");
        const head = el("div", "wfhead", `<span class="t-${type}">${icon(type, 22)}</span><b>${CONFIG.tasks[type].label}</b><span class="pill"></span>`);
        const pill = head.querySelector(".pill");
        const lvl = el("div", "wflevel", L ? `Niveau ${L} sur ${A.maxLevel} · ${A.levelNames[L]}` : "Pas encore automatisé");
        const stats = el("div", "wfstats");
        card.append(head, lvl, stats);

        if (L > 0) {
          const v = verifyOn(type);
          const vb = el("button", "toggle" + (v ? " on" : ""), `<i></i><span><b>Vérification ${v ? "activée" : "désactivée"}</b><small>${v ? "Plus lent, mais aucun bug." : "Plus rapide, mais risque de bug."}</small></span>`);
          vb.onclick = () => setVerify(type, !v);
          card.append(vb);
        }
        if (L > 0 && maxDemand(type) > L) card.append(el("p", "warn", `Des clients envoient des tâches de difficulté ${maxDemand(type)} : elles restent manuelles. Monte au niveau ${maxDemand(type)}.`));

        let label;
        if (atMax(type)) label = "Niveau maximum";
        else if (needsYanis(type)) label = "Recrute Yanis pour monter plus haut";
        else label = L === 0 ? `Installer · ${fmt(installCost(type))} EUR · ${installTime(type)} s` : `Niveau ${L + 1} · ${upgradeCost(type)} h · ${installTime(type)} s`;
        if (upgrading(type)) label = "Installation en cours";
        const btn = el("button", "btn", label);
        btn.disabled = !canUpgrade(type);
        btn.onclick = () => upgrade(type);
        const ibar = el("i", "bar instbar"); ibar.innerHTML = "<b></b>"; ibar.style.display = upgrading(type) ? "block" : "none";
        if (!atMax(type)) { card.append(btn, ibar); }
        else card.append(el("p", "muted small", "Niveau maximum atteint."));

        live(() => {
          const st = status(type);
          setText(pill, STATUS[st]); pill.className = "pill st-" + st;
          if (upgrading(type)) {
            const left = upgradeLeft(type), tot = auto(type).upgrading ? auto(type).upgrading.total : 1;
            ibar.firstChild.style.width = (100 - (left / tot) * 100) + "%";
            setText(btn, `Installation en cours : ${Math.ceil(left)} s`);
          }
          setText(stats, L ? `${fmt1(rate(type) * 60)} tâches/min · gère la difficulté ${L === 1 ? "1" : "1 à " + L} · ${auto(type).backlog.length} en attente` : "Installe une automatisation pour gagner des heures.");
        });
        r.append(card);
      }
    });
  },
  update() { this.view.update(); },
};
