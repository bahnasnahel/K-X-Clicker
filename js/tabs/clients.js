import { el, fmt, fmt1, fmt2, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state, securityScore } from "../state.js";
import { icon } from "../icons.js";
import { sfx } from "../audio.js";
import { modal, infoDialog, confirmDialog } from "../modal.js";
import { avatar } from "../avatar.js";
import { signOffer, dropOffer, terminateClient, satRate, clientIncome, incomePerSec, previewService, rankLabel } from "../clients.js";
import { staffList, assignedTo, timeGiven, skillGiven, service, assign, autoAssign, payroll } from "../staff.js";
import { renderMissions } from "../missions.js";
import { clientAdCost, adIsFree, canClientAd, launchClientAd, adRunning, adLeft } from "../ads.js";

const types = (list) => list.map((t) => `<span class="t-${t}">${icon(t, 16)}</span>`).join("");
const mood = (s) => (s >= 75 ? "Satisfait" : s >= 45 ? "Correct" : s >= 20 ? "Mécontent" : "Va résilier");
const pct = (v) => Math.round(v * 100) + " %";
const profil = (m) => (m >= 1.3 ? "exigeant, rapporte plus" : m <= 0.8 ? "modeste" : "standard");
const servClass = (v) => (v >= 0.9 ? "good" : v >= 0.6 ? "mid" : "bad");

function assignDialog(c) {
  modal((box, close) => {
    box.append(el("h3", "h", `Affecter à ${c.name}`));
    box.append(el("p", "muted small", `Besoin : ${c.need.time} h de temps et niveau ${c.need.skill}. Touche une personne pour l'affecter ou la retirer.`));
    for (const p of staffList()) {
      const cur = state.assign[p.id], here = cur === c.id;
      const other = cur && !here ? state.clients.find((x) => x.id === cur) : null;
      const b = el("button", "opt-block" + (here ? " cur" : ""),
        `<span class="optrow">${avatar(p, "", p.isDirector ? null : "e:" + p.id)}<span><b>${p.name || p.title}</b><span>${p.title} · ${p.time} h · niveau ${p.skill}${other ? " · chez " + other.name : here ? " · affecté ici" : ""}</span></span></span>`);
      b.onclick = () => { assign(p.id, c.id); sfx.ok(); close(); };
      box.append(b);
    }
    const cl = el("button", "btn", "Fermer"); cl.onclick = () => close(); box.append(cl);
  });
}

export default {
  id: "clients", label: "Clients", icon: "clients",
  badge: () => state.offers.length > 0,
  mount(root) {
    const sig = () => JSON.stringify([state.offers.map((o) => o.id), state.clients.map((c) => c.id), state.autoAssign, state.assign, state.staff, state.missions.list.map((m) => [m.id, m.done]), state.missions.swapAt <= state.stats.playSeconds, adRunning("client"), canClientAd(), clientAdCost(), state.team.nahel.lvl]);
    this.view = liveView(root, sig, (r, live) => {
      const help = el("button", "helpbtn", "<i>?</i>"); help.setAttribute("aria-label", "Aide : crédibilité");
      help.onclick = () => { const [t, txt] = CONFIG.help.credibility; infoDialog(t, `<p>${txt}</p>`, "Compris"); };
      const helpSat = el("button", "helpbtn", "<i>?</i>"); helpSat.setAttribute("aria-label", "Aide : satisfaction");
      helpSat.onclick = () => { const [t, txt] = CONFIG.help.satisfaction; infoDialog(t, `<p>${txt}</p>`, "Compris"); };
      const head = el("div", "qhead", `<h2 class="h">Clients</h2><span class="qcount"></span>`);
      head.append(helpSat);
      const cnt = head.querySelector(".qcount");
      live(() => setText(cnt, `${state.clients.length} client${state.clients.length > 1 ? "s" : ""}`));
      r.append(head);

      const cred = el("div", "card credcard");
      cred.innerHTML = `<div class="credhead"><b>Crédibilité</b><span class="credval"></span></div><i class="bar"><b></b></i><div class="fin"></div>`;
      cred.querySelector(".credhead").append(help);
      const cb = cred.querySelector(".bar b"), cv = cred.querySelector(".credval"), fin = cred.querySelector(".fin");
      live(() => {
        const v = state.credibility;
        cb.style.width = v + "%"; cb.style.background = v >= 50 ? "var(--v)" : v >= 25 ? "var(--m)" : "#ff5d7a";
        setText(cv, Math.round(v) + " %");
        setText(fin, `Abonnements +${fmt2(incomePerSec())} EUR/s · Salaires −${fmt2(payroll())} EUR/s`);
      });
      r.append(cred);

      renderMissions(r, live);

      // capacite de l'equipe : temps et competences disponibles / utilises
      const cap = el("div", "card capcard");
      const people = staffList();
      const total = people.reduce((t, p) => t + p.time, 0);
      cap.innerHTML = `<div class="credhead"><b>Ton équipe</b><span class="capval"></span></div><i class="bar"><b></b></i>
        <div class="chips">${people.map((p) => `<span class="chip2 ${state.assign[p.id] ? "busy" : "free"}">${p.isNahel ? "Toi" : p.prenom} · niv ${p.skill} · ${p.time} h</span>`).join("")}</div>
        <div class="fin">Plein = occupé, clair = disponible. Niveau = compétence.</div>`;
      const cbar = cap.querySelector(".bar b"), cval = cap.querySelector(".capval");
      live(() => {
        const used = people.filter((p) => state.assign[p.id]).reduce((t, p) => t + p.time, 0);
        cbar.style.width = (total ? (used / total) * 100 : 0) + "%"; cbar.style.background = "var(--m)";
        setText(cval, `${used} / ${total} h utilisées`);
      });
      r.append(cap);

      // publicite : la seule facon de trouver des clients
      const ad = el("div", "card adcard");
      const free = adIsFree("client");
      ad.innerHTML = `<div class="cinfo"><b>Publicité</b><span class="sdesc">Lance une campagne pour que des clients se présentent. Plus ta crédibilité est haute, plus il y en a.</span><i class="bar adbar"><b></b></i><span class="satline adline"></span></div>`;
      const abtn = el("button", "btn small-btn", free ? "Campagne<br><small>offerte</small>" : `Campagne<br><small>${fmt(clientAdCost())} EUR</small>`);
      abtn.disabled = !canClientAd();
      abtn.onclick = () => launchClientAd();
      ad.append(abtn);
      const abar = ad.querySelector(".adbar b"), aline = ad.querySelector(".adline");
      live(() => {
        if (adRunning("client")) { const left = adLeft("client"); abar.style.width = (100 - (left / (state.ads.client.total || CONFIG.ads.client.durationSec)) * 100) + "%"; setText(aline, `Campagne en cours : ${Math.ceil(left)} s`); }
        else { abar.style.width = "0"; setText(aline, state.offers.length >= CONFIG.ads.client.maxPending ? "Trop de demandes en attente : signe-en avant de relancer." : ""); }
      });
      r.append(ad);

      const at = el("button", "toggle" + (state.autoAssign ? " on" : ""), `<i></i><span><b>Affectation automatique ${state.autoAssign ? "activée" : "désactivée"}</b><small>${state.autoAssign ? "Le jeu répartit ton équipe entre les clients." : "Tu choisis qui travaille pour quel client."}</small></span>`);
      at.onclick = () => { state.autoAssign = !state.autoAssign; if (state.autoAssign) autoAssign(); sfx.tap(); };
      r.append(at);

      // paliers de clients : conditions pour les voir arriver
      const tiers = el("div", "card tiercard");
      tiers.append(el("div", "credhead", "<b>Rangs de clients</b>"));
      Object.entries(CONFIG.sizes).forEach(([k, z]) => {
        const ok = state.runMoney >= z.minMoney && state.credibility >= z.minCred && securityScore() >= z.minSec;
        const steps = [z.minMoney, ...z.levelMoney], got = steps.filter((m) => state.runMoney >= m).length;
        const lvTxt = got < steps.length ? `Niv. ${got} ouvert, Niv. ${got + 1} à ${fmt(steps[got])} EUR gagnés` : "tous les niveaux ouverts";
        tiers.append(el("div", "tierrow " + (ok ? "ok" : "lock"), `<b>${z.label}</b><span>${ok ? lvTxt : `il faut ${fmt(z.minMoney)} EUR gagnés, ${z.minCred} % de crédibilité${z.minSec ? ` et ${z.minSec} de score de sécurité` : ""}`}</span>`));
      });
      r.append(tiers);

      r.append(el("p", "qlabel", "Demandes de clients"));
      if (!state.offers.length) r.append(el("p", "muted", "Aucune demande pour le moment. Lance une campagne de publicité."));
      for (const o of [...state.offers].sort((a, b) => b.pay - a.pay)) {          // du plus rentable au moins rentable
        const sec = CONFIG.sectors[o.sector], sv = previewService(o);
        const c = el("div", "card client offer");
        c.insertAdjacentHTML("beforeend", avatar({}, "", "c:" + o.id));
        c.append(el("div", "cinfo", `<b>${o.name}</b><span class="kind">${sec.label} · ${rankLabel(o)} · ${profil(o.profile || 1)}</span><span class="ctasks">${types(o.types)}</span>
          <span class="need">Besoin : ${o.need.time} h · niveau ${o.need.skill}</span><span class="serv ${servClass(sv)}">Service estimé avec ton équipe libre : ${pct(sv)}</span><span class="gold">${fmt2(o.pay)} EUR / s</span>`));
        const col = el("span", "btncol");
        const b = el("button", "btn small-btn", "Signer");
        b.onclick = () => signOffer(o.id);
        const no = el("button", "btn small-btn ghost", "Refuser");
        no.onclick = () => { dropOffer(o.id); sfx.tap(); };
        col.append(b, no); c.append(col);
        r.append(c);
      }

      r.append(el("p", "qlabel", "Clients signés"));
      if (!state.clients.length) r.append(el("p", "muted", "Signe ton premier client pour des revenus passifs."));
      for (const cl of [...state.clients].sort((a, b) => b.pay - a.pay)) {         // du plus rentable au moins rentable
        const sec = CONFIG.sectors[cl.sector];
        const who = assignedTo(cl.id);
        const c = el("div", "card client");
        c.innerHTML = `${avatar({}, "", "c:" + cl.id)}<div class="cinfo"><b>${cl.name}</b><span class="kind">${sec.label} · ${rankLabel(cl)} · ${profil(cl.profile || 1)}</span><span class="ctasks">${types(cl.types)}</span>
          <span class="need"></span><i class="bar svc"><b></b></i><span class="satline"></span><span class="evol"></span>
          <span class="staffrow">${who.map((p) => `<span class="chip2 busy">${p.isNahel ? "Toi" : p.prenom} · niv ${p.skill} · ${p.time} h</span>`).join("") || "<em>Personne d'affecté</em>"}</span></div>`;
        const col = el("span", "btncol");
        const b = el("button", "btn small-btn", "Affecter");
        b.onclick = () => assignDialog(cl);
        const stop = el("button", "btn small-btn ghost", "Arrêter");
        stop.onclick = async () => {
          const ok = await confirmDialog("Arrêter le contrat ?", `${cl.name} partira et son abonnement s'arrêtera. Ta crédibilité baisse un peu (${CONFIG.clients.terminateCred}).`, "Arrêter");
          if (ok) terminateClient(cl.id);
        };
        col.append(b, stop); c.append(col);
        const need = c.querySelector(".need"), bar = c.querySelector(".svc b"), line = c.querySelector(".satline"), evol = c.querySelector(".evol");
        live(() => {
          const sv = service(cl);
          setText(need, `Temps ${fmt1(timeGiven(cl))}/${cl.need.time} h · niveau ${skillGiven(cl)}/${cl.need.skill} · service ${pct(sv)}`);
          need.className = "need serv " + servClass(sv);
          bar.style.width = sv * 100 + "%";
          bar.style.background = sv >= 0.9 ? "var(--v)" : sv >= 0.6 ? "var(--m)" : "#ff5d7a";
          setText(line, `${mood(cl.sat)} · satisfaction ${Math.round(cl.sat)} % · ${fmt2(clientIncome(cl))} EUR/s`);
          const sr = satRate(cl), per = sr.total * 60;
          setText(evol, `Évolution : ${per >= 0 ? "+" : "-"}${Math.abs(per).toFixed(1).replace(".", ",")} % par minute · ${sr.parts.map((p) => p.txt).join(", ")}${cl.sat < 25 ? " · RISQUE DE RÉSILIATION" : ""}`);
          evol.className = "evol " + (sr.total >= 0 ? "up" : cl.sat < 25 ? "crit" : "down");
        });
        r.append(c);
      }
    });
  },
  update() { this.view.update(); },
};
