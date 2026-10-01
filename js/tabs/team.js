import { el, fmt, fmt2, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state, office, nahelMult, yanisHoursMult } from "../state.js";
import { sfx } from "../audio.js";
import { confirmDialog } from "../modal.js";
import { portrait, activePerson } from "../bubbles.js";
import { avatar } from "../avatar.js";
import { recruit, upgrade, upgradeCost, isVisible, jaddTap, goodChance, goodEffectMult } from "../crew.js";
import { huntSpeed, huntMode, huntCount, MODES } from "../security.js";
import { staffList, directorStat, candidates, hire, fire, maxStaff, officeMax, nextOffice, officeCost, upgradeOffice, hireCost } from "../staff.js";
import { recruitAdCost, canRecruitAd, launchRecruitAd, adRunning, adLeft, dismissCandidate, maxTier, nextTier } from "../ads.js";

const T = CONFIG.team;
const pct = (v) => Math.round(v * 100);
const effect = (id) => {
  const m = state.team[id];
  const n = directorStat(id), work = `${n.time} h de travail · compétence ${n.skill}`;
  if (id === "nahel") return `Niveau ${m.lvl} · gains d'argent x${nahelMult().toFixed(2).replace(".", ",")} · ${work}`;
  if (!m.on) return "";
  if (id === "yanis") return `Niveau ${m.lvl} · automatisation +${pct(m.lvl * T.yanis.speedBonus)} % · heures x${yanisHoursMult().toString().replace(".", ",")} · ${work}`;
  if (id === "jadd") return `Niveau ${m.lvl} · ${pct(goodChance())} % d'événements positifs · effet des bons événements x${(m => (m < 1000 ? String(+m.toFixed(1)).replace(".", ",") : fmt(m)))(goodEffectMult())} · ${work}`;
  if (id === "noah") return `Niveau ${m.lvl} · traque ${huntSpeed().toFixed(1).replace(".", ",")} pt/s · ${huntCount()} cible${huntCount() > 1 ? "s" : ""} : ${MODES[huntMode()].toLowerCase()} · ${work}`;
};
const nextBonus = (id) => {           // prochain gros palier
  const every = id === "nahel" ? T.nahel.bigBoostEvery : id === "yanis" ? T.yanis.hoursEvery : 0;
  if (!every) return "";
  const l = state.team[id].lvl, nxt = (Math.floor(l / every) + 1) * every;
  return nxt <= T[id].maxLevel ? `Gros boost au niveau ${nxt}.` : "";
};

export default {
  id: "team", label: "Équipe", icon: "team",
  badge: () => candidates().some((e) => state.money >= hireCost(e)) && state.staff.length < maxStaff(),
  mount(root) {
    const sig = () => JSON.stringify([
      Object.keys(T).map((id) => [state.team[id].on, state.team[id].lvl, isVisible(id), state.money >= (state.team[id].on ? upgradeCost(id) : T[id].recruit)]),
      state.staff, state.assign, state.clients.map((c) => c.id), state.candidates, candidates().map((e) => state.money >= hireCost(e)),
      state.city, state.office, state.money >= officeCost(), adRunning("recruit"), canRecruitAd(), canRecruitAd(true), recruitAdCost(), maxTier(),
    ]);
    this.cards = {};
    this.view = liveView(root, sig, (r, live) => {
      this.cards = {};

      // bureau
      r.append(el("h2", "h", "Bureau"));
      const off = el("div", "card officecard");
      const nx = nextOffice();
      off.innerHTML = `<div class="cinfo"><b>${office().name}</b><span class="sdesc">${state.staff.length} / ${maxStaff()} places occupées.${nx ? ` Prochain : ${nx.name} (${nx.staff} places).` : " Niveau maximum."}</span></div>`;
      if (nx) { const b = el("button", "btn small-btn", `Améliorer<br><small>${fmt(officeCost())} EUR</small>`); b.disabled = state.money < officeCost(); b.onclick = () => upgradeOffice(); off.append(b); }
      r.append(off);

      r.append(el("h2", "h", "Direction"));
      for (const id of Object.keys(T)) {
        if (!isVisible(id)) continue;
        const cfg = T[id], m = state.team[id];
        const c = el("div", "card person");
        const fx = effect(id), nb = m.on || id === "nahel" ? nextBonus(id) : "";
        c.innerHTML = `${portrait(id)}<span class="pt"><span class="nm">${cfg.name}</span><span class="rl">${cfg.role}</span>
          <span class="ds">${cfg.desc}</span>${fx ? `<span class="fx">${fx}</span>` : ""}${nb ? `<span class="fx boost">${nb}</span>` : ""}<span class="acts"></span></span>`;
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
      r.append(el("div", "qhead", `<h2 class="h">Employés</h2><span class="qcount">${state.staff.length} / ${maxStaff()}</span>`));
      r.append(el("p", "muted small", "Chaque employé apporte du temps et un niveau de compétence pour servir tes clients. Il coûte un salaire en continu."));
      const hired = staffList().filter((p) => !p.isDirector);
      if (!hired.length) r.append(el("p", "muted", "Personne pour l'instant : tu travailles seul."));
      for (const p of hired) {
        const cl = state.clients.find((c) => c.id === state.assign[p.id]);
        const c = el("div", "card emp");
        c.innerHTML = `${avatar(p, "", "e:" + p.id)}<span class="pt"><span class="nm">${p.name}</span><span class="rl">${p.title}</span>
          <span class="fx">${p.time} h · niveau ${p.skill} · salaire ${fmt2(p.salary)} EUR/s</span><span class="ds">${cl ? "Travaille pour " + cl.name : "Sans affectation"}</span></span>`;
        const f = el("button", "btn small-btn ghost", "Licencier");
        f.onclick = async () => { if (await confirmDialog("Licencier ?", `${p.name} quittera K'X. Son embauche ne sera pas remboursée.`, "Licencier")) fire(p.id); };
        c.append(f);
        r.append(c);
      }

      // recrutement par campagne
      r.append(el("p", "qlabel", "Recrutement"));
      const ad = el("div", "card adcard");
      const nt = nextTier(), T0 = CONFIG.ads.recruit;
      ad.innerHTML = `<div class="cinfo"><b>Campagne de recrutement</b>
        <span class="sdesc">Avec ta crédibilité (${Math.round(state.credibility)} %), tu attires des profils jusqu'au <b>niveau ${maxTier()} sur 5</b>${nt ? `. Le niveau ${nt.tier} demande ${nt.cred} % de crédibilité` : ""}. Les profils sont différents à chaque campagne.</span>
        <span class="sdesc">Campagne ciblée : coûte ${T0.targetedMult} fois plus et cherche un niveau au-dessus.</span>
        <i class="bar adbar"><b></b></i><span class="satline adline"></span></div>`;
      const abtns = el("span", "btncol");
      const ab = el("button", "btn small-btn", `Campagne<br><small>${recruitAdCost() ? fmt(recruitAdCost()) + " EUR" : "offerte"}</small>`);
      ab.disabled = !canRecruitAd();
      ab.onclick = () => launchRecruitAd(false);
      const at = el("button", "btn small-btn ghost", `Ciblée<br><small>${fmt(recruitAdCost(true))} EUR</small>`);
      at.disabled = !canRecruitAd(true);
      at.onclick = () => launchRecruitAd(true);
      abtns.append(ab, at); ad.append(abtns);
      const abar = ad.querySelector(".adbar b"), aline = ad.querySelector(".adline");
      live(() => {
        if (adRunning("recruit")) { const left = adLeft("recruit"); abar.style.width = (100 - (left / CONFIG.ads.recruit.durationSec) * 100) + "%"; setText(aline, `Campagne en cours : ${Math.ceil(left)} s`); }
        else { abar.style.width = "0"; setText(aline, state.staff.length >= maxStaff() ? "Bureau plein : améliore-le pour embaucher." : state.candidates.length >= CONFIG.ads.recruit.maxPending ? "Liste pleine : embauche ou refuse un profil." : ""); }
      });
      r.append(ad);

      const cands = candidates();
      if (cands.length) r.append(el("p", "qlabel", "Profils à étudier"));
      for (const e of cands) {
        const c = el("div", "card emp cand");
        c.innerHTML = `${avatar(e, "", "e:" + e.id)}<span class="pt"><span class="nm">${e.name}</span><span class="rl">${e.titre} · profil ${e.tier}/5</span>
          <span class="fx">${e.time} h · niveau ${e.skill} · salaire ${fmt2(e.salary)} EUR/s</span></span>`;
        const col = el("span", "btncol");
        const b = el("button", "btn small-btn", `Embaucher<br><small>${fmt(hireCost(e))} EUR</small>`);
        b.disabled = state.money < hireCost(e) || state.staff.length >= maxStaff();
        b.onclick = () => hire(e.id);
        const no = el("button", "btn small-btn ghost", "Refuser");
        no.onclick = () => { dismissCandidate(e.id); sfx.tap(); };
        col.append(b, no); c.append(col);
        r.append(c);
      }
    });
  },
  update() {
    this.view.update();
    const a = activePerson() || "nahel";
    for (const [id, c] of Object.entries(this.cards)) c.classList.toggle("on", id === a);
  },
};
