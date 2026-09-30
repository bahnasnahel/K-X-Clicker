import { el, fmt, fmt1, fmt2, liveView } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";
import { confirmDialog } from "../modal.js";
import { portrait, activePerson } from "../bubbles.js";
import { avatar } from "../avatar.js";
import { recruit, upgrade, upgradeCost, isVisible, jaddTap, jaddEvery, noahBlock } from "../crew.js";
import { staffList, nahelStat, candidates, hire, fire, maxStaff, hiringLocked } from "../staff.js";

const T = CONFIG.team;
const effect = (id) => {
  const m = state.team[id];
  if (id === "nahel") { const n = nahelStat(); return `Niveau ${m.lvl} · gains à la main +${Math.round(m.lvl * T.nahel.manualBonus * 100)} % · ${n.time} h de travail · compétence ${n.skill}`; }
  if (!m.on) return "";
  if (id === "yanis") return `Niveau ${m.lvl} · automatisations +${Math.round(m.lvl * T.yanis.speedBonus * 100)} % · niveaux 5 et plus débloqués`;
  if (id === "jadd") return `Niveau ${m.lvl} · une fenêtre toutes les ${Math.round(jaddEvery())} s`;
  if (id === "noah") return `Niveau ${m.lvl} · blocage automatique ${Math.round(noahBlock() * 100)} %`;
};

export default {
  id: "team", label: "Équipe", icon: "team",
  badge: () => candidates().some((e) => state.money >= e.hire) && state.staff.length < maxStaff(),
  mount(root) {
    const sig = () => JSON.stringify([
      Object.keys(T).map((id) => [state.team[id].on, state.team[id].lvl, isVisible(id), state.money >= (state.team[id].on ? upgradeCost(id) : T[id].recruit)]),
      state.staff, state.assign, state.clients.map((c) => c.id), candidates().map((e) => [e.id, state.money >= e.hire]), state.city,
    ]);
    this.cards = {};
    this.view = liveView(root, sig, (r) => {
      this.cards = {};
      r.append(el("h2", "h", "Direction"));
      for (const id of Object.keys(T)) {
        if (!isVisible(id)) continue;
        const cfg = T[id], m = state.team[id];
        const c = el("div", "card person");
        const fx = effect(id);
        c.innerHTML = `${portrait(id)}<span class="pt"><span class="nm">${cfg.name}</span><span class="rl">${cfg.role}</span>
          <span class="ds">${cfg.desc}</span>${fx ? `<span class="fx">${fx}</span>` : ""}<span class="acts"></span></span>`;
        const acts = c.querySelector(".acts");
        let b = null;
        if (!m.on) { b = el("button", "btn small-btn wide", `Recruter · ${fmt(cfg.recruit)} EUR`); b.disabled = state.money < cfg.recruit; b.onclick = (e) => { e.stopPropagation(); recruit(id); }; }
        else if (m.lvl < cfg.maxLevel) { b = el("button", "btn small-btn wide", `Améliorer · ${fmt(upgradeCost(id))} EUR`); b.disabled = state.money < upgradeCost(id); b.onclick = (e) => { e.stopPropagation(); upgrade(id); }; }
        else acts.append(el("span", "fx", "Niveau maximum"));
        if (b) acts.append(b);
        c.onclick = () => (id === "jadd" && m.on ? jaddTap() : sfx.tap());
        r.append(c);
        this.cards[id] = c;
      }

      // employes
      const head = el("div", "qhead", `<h2 class="h">Employés</h2><span class="qcount">${state.staff.length} / ${maxStaff()}</span>`);
      r.append(head);
      r.append(el("p", "muted small", "Chaque employé apporte du temps et un niveau de compétence pour servir tes clients. Il coûte un salaire en continu."));
      const hired = staffList().filter((p) => !p.isNahel);
      if (!hired.length) r.append(el("p", "muted", "Personne pour l'instant : tu travailles seul."));
      for (const p of hired) {
        const cl = state.clients.find((c) => c.id === state.assign[p.id]);
        const c = el("div", "card emp");
        c.innerHTML = `${avatar(p)}<span class="pt"><span class="nm">${p.name}</span><span class="rl">${p.title}</span>
          <span class="fx">${p.time} h · niveau ${p.skill} · salaire ${fmt2(p.salary)} EUR/s</span><span class="ds">${cl ? "Travaille pour " + cl.name : "Sans affectation"}</span></span>`;
        const f = el("button", "btn small-btn ghost", "Licencier");
        f.onclick = async () => { if (await confirmDialog("Licencier ?", `${p.name} quittera K'X. Son embauche ne sera pas remboursée.`, "Licencier")) fire(p.id); };
        c.append(f);
        r.append(c);
      }

      // recrutement
      r.append(el("p", "qlabel", "À embaucher"));
      const cands = candidates().slice(0, 3);
      if (state.staff.length >= maxStaff()) r.append(el("p", "muted", "Équipe complète. Ouvre une agence plus grande pour embaucher davantage."));
      else if (!cands.length) r.append(el("p", "muted", "Aucun profil disponible pour le moment."));
      else for (const e of cands) {
        const c = el("div", "card emp cand");
        c.innerHTML = `${avatar(e)}<span class="pt"><span class="nm">${e.name}</span><span class="rl">${e.titre}</span>
          <span class="fx">${e.time} h · niveau ${e.skill} · salaire ${fmt2(e.salary)} EUR/s</span></span>`;
        const b = el("button", "btn small-btn", `Embaucher<br><small>${fmt(e.hire)} EUR</small>`);
        b.disabled = state.money < e.hire;
        b.onclick = () => hire(e.id);
        c.append(b);
        r.append(c);
      }
      if (hiringLocked() > 0 && state.staff.length < maxStaff()) r.append(el("p", "muted small", "De meilleurs profils se présenteront quand tu auras gagné plus d'argent."));
    });
  },
  update() {
    this.view.update();
    const a = activePerson() || "nahel";
    for (const [id, c] of Object.entries(this.cards)) c.classList.toggle("on", id === a);
  },
};
