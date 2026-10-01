import { el, fmt, fmt1, fmt2, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { sfx } from "../audio.js";
import { confirmDialog } from "../modal.js";
import { cityName, owned, price, canBuy, buyAgency, switchAgency, pointsGain, rebirth, passiveRates } from "../agencies.js";
import * as shop from "../shop.js";

const P = CONFIG.prestige;

export default {
  id: "agency", label: "Agences", icon: "agency",
  badge: () => P.cities.some((_, i) => canBuy(i)) || shop.items().some((it) => shop.canBuy(it)),
  mount(root) {
    const sig = () => JSON.stringify([
      state.city, state.cities.map((c) => [c.unlocked, !!c.data]), P.cities.map((_, i) => canBuy(i)),
      state.points, state.shop, pointsGain(), Math.floor(state.hoursRun / 5),
    ]);
    this.view = liveView(root, sig, (r, live) => {
      r.append(el("h2", "h", "Agences"));

      // compteur total d'heures gagnees (toutes agences confondues)
      const tot = el("div", "card totalcard");
      tot.innerHTML = `<span class="kind">Heures gagnées au total</span><b class="totval"></b><span class="sdesc totsub"></span>`;
      const tv = tot.querySelector(".totval"), ts = tot.querySelector(".totsub");
      live(() => {
        setText(tv, `${fmt(state.lifetimeHours)} h`);
        setText(ts, `dont ${fmt(state.hoursRun)} h dans l'agence que tu diriges`);
      });
      r.append(tot);

      // explication
      const how = el("div", "card howcard");
      how.innerHTML = `<div class="credhead"><b>Comment ça marche ?</b></div>
        <p><b>Les agences.</b> Chaque ville est une agence avec ses propres clients, employés, bureau, automatisations et direction. Elles <b>tournent en parallèle</b> : une agence que tu ne diriges pas continue de produire de l'argent et des heures, à ${Math.round(P.passiveFactor * 100)} % de son rythme. L'argent est commun à toute l'entreprise.</p>
        <p><b>Débloquer une agence.</b> Il faut la payer en euros, très cher : c'est ce qui te pousse à progresser. Les agences s'ouvrent dans l'ordre.</p>
        <p><b>Remettre à zéro.</b> Tu peux remettre à zéro l'agence que tu diriges (clients, employés, bureau, automatisations, direction, crédibilité). En échange tu gagnes des <b>points</b>, selon les heures gagnées dans cette agence. Ton argent, tes succès et tes autres agences ne bougent pas.</p>
        <p><b>La boutique permanente.</b> Les points s'y dépensent pour des bonus qui restent pour toujours, dans toutes les agences : départs plus forts, réductions, bonus de gains et déblocages plus tôt.</p>`;
      r.append(how);

      // liste des agences
      r.append(el("p", "qlabel", "Tes agences"));
      P.cities.forEach((name, i) => {
        const c = state.cities[i], isCur = i === state.city;
        const card = el("div", "card agencycard" + (isCur ? " cur" : ""));
        const info = el("div", "cinfo");
        info.innerHTML = `<b>K'X ${name}</b><span class="kind"></span><span class="sdesc"></span>`;
        const kind = info.querySelector(".kind"), desc = info.querySelector(".sdesc");
        card.append(info);
        if (isCur) {
          live(() => { setText(kind, "Agence que tu diriges"); setText(desc, `${fmt(state.hoursRun)} h gagnées · ${state.clients.length} client${state.clients.length > 1 ? "s" : ""} · ${state.staff.length} employé${state.staff.length > 1 ? "s" : ""}`); });
        } else if (c.unlocked && c.data) {
          const d = c.data, pr = c.passive;
          setText(kind, "Tourne en ton absence");
          live(() => setText(desc, `${fmt(d.hoursRun)} h gagnées · ${d.clients.length} client${d.clients.length > 1 ? "s" : ""} · +${fmt2(pr.euro * P.passiveFactor)} EUR/s, +${fmt1(pr.hours * P.passiveFactor * 60)} h/min`));
          const go = el("button", "btn small-btn", "Diriger");
          go.onclick = () => switchAgency(i);
          card.append(go);
        } else {
          setText(kind, "Verrouillée");
          const prevOk = i === 0 || owned(i - 1);
          setText(desc, (prevOk ? "" : `Débloque d'abord K'X ${P.cities[i - 1]}. `) + P.news[i]);
          const b = el("button", "btn small-btn", `Débloquer<br><small>${fmt(price(i))} EUR</small>`);
          b.disabled = !canBuy(i);
          b.onclick = async () => { if (await confirmDialog(`Débloquer K'X ${name} ?`, `Cela coûte ${fmt(price(i))} EUR, pris sur l'argent de l'entreprise. L'agence démarre de zéro et tu pourras la diriger quand tu veux.`, "Débloquer")) buyAgency(i); };
          card.append(b);
        }
        r.append(card);
      });

      // remise a zero
      r.append(el("p", "qlabel", "Remettre cette agence à zéro"));
      const rb = el("div", "card rebirthcard");
      const g = pointsGain();
      rb.innerHTML = `<div class="cinfo"><b>K'X ${cityName()}</b>
        <span class="sdesc">Tu as gagné <b>${fmt(state.hoursRun)} h</b> dans cette agence. Si tu la remets à zéro maintenant, tu gagnes <b>${g} point${g > 1 ? "s" : ""}</b>.</span>
        <span class="sdesc">Tu perds : clients, employés, bureau, automatisations, direction et crédibilité de cette agence. Tu gardes : l'argent, les succès, la boutique et tes autres agences.</span></div>`;
      const rbtn = el("button", "btn small-btn", `Remettre à zéro<br><small>+${g} point${g > 1 ? "s" : ""}</small>`);
      rbtn.disabled = g < 1;
      rbtn.onclick = async () => {
        if (await confirmDialog("Remettre cette agence à zéro ?", `Tu gagnes +${g} point${g > 1 ? "s" : ""} pour la boutique permanente. K'X ${cityName()} repart de zéro (clients, employés, bureau, automatisations, direction), avec les départs de ta boutique.`, "Remettre à zéro")) rebirth();
      };
      rb.append(rbtn);
      r.append(rb);
      if (g < 1) r.append(el("p", "muted small", "Il faut avoir gagné au moins quelques heures dans cette agence pour obtenir un point."));

      // boutique permanente
      const head = el("div", "qhead", `<h2 class="h">Boutique permanente</h2><span class="qcount">${state.points} point${state.points > 1 ? "s" : ""}</span>`);
      r.append(head);
      r.append(el("p", "muted small", "Les bonus achetés ici s'appliquent à toutes tes agences, pour toujours."));
      CONFIG.shop.groups.forEach((gname, gi) => {
        const its = shop.items().filter((it) => it.group === gi);
        r.append(el("p", "qlabel", gname));
        for (const it of its) {
          const lv = shop.level(it.id), card = el("div", "card shoprow");
          const now = lv ? shop.effectText(it, lv) : "aucun";
          const nxt = shop.maxed(it) ? "niveau maximum" : `suivant : ${shop.effectText(it, lv + 1)}`;
          card.append(el("div", "sinfo", `<b>${it.label} · niv ${lv}/${it.max}</b><span class="sdesc">${it.desc}</span><span class="kind">Actuel : ${now} · ${nxt}</span>`));
          const b = el("button", "btn small-btn", shop.maxed(it) ? "Max" : `Niv ${lv + 1}<br><small>${shop.cost(it)} pt${shop.cost(it) > 1 ? "s" : ""}</small>`);
          b.disabled = !shop.canBuy(it);
          b.onclick = () => shop.buy(it.id);
          card.append(b);
          r.append(card);
        }
      });
    });
  },
  update() { this.view.update(); },
};
