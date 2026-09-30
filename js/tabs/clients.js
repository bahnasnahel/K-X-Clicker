import { el, fmt, fmt2, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { icon } from "../icons.js";
import { sfx } from "../audio.js";
import { maxClients, signOffer, dropOffer, clientIncome, incomePerSec, payFactor } from "../clients.js";

const types = (list) => list.map((t) => `<span class="t-${t}">${icon(t, 16)}</span>`).join("");
const mood = (s) => (s >= 75 ? "Satisfait" : s >= 45 ? "Correct" : s >= 20 ? "Mécontent" : "Va résilier");

export default {
  id: "clients", label: "Clients", icon: "clients",
  badge: () => state.offers.length > 0 && state.clients.length < maxClients(),
  mount(root) {
    const sig = () => JSON.stringify([state.offers.map((o) => o.id), state.clients.map((c) => c.id), state.clients.length >= maxClients()]);
    this.view = liveView(root, sig, (r, live) => {
      const head = el("div", "qhead", `<h2 class="h">Clients</h2><span class="qcount"></span>`);
      const cnt = head.querySelector(".qcount");
      live(() => setText(cnt, `${state.clients.length} / ${maxClients()}`));
      const inc = el("p", "income");
      live(() => setText(inc, `Revenus passifs : ${fmt2(incomePerSec())} EUR / s`));
      r.append(head, inc);

      r.append(el("p", "qlabel", "Demandes de clients"));
      if (!state.offers.length) r.append(el("p", "muted", "Aucune demande pour le moment. De nouveaux clients arrivent régulièrement."));
      for (const o of state.offers) {
        const sec = CONFIG.sectors[o.sector], full = state.clients.length >= maxClients();
        const c = el("div", "card client offer");
        c.append(el("div", "cinfo", `<b>${o.name}</b><span class="kind">${sec.label} · ${CONFIG.sizes[o.size].label}</span><span class="ctasks">${types(o.types)}</span><span class="gold">${fmt2(o.pay)} EUR / s</span>`));
        const b = el("button", "btn small-btn", full ? "Agence<br>pleine" : "Signer");
        b.disabled = full;
        b.onclick = () => signOffer(o.id);
        c.append(b);
        r.append(c);
      }

      r.append(el("p", "qlabel", "Clients signés"));
      if (!state.clients.length) r.append(el("p", "muted", "Signe ton premier client pour des revenus passifs."));
      for (const cl of state.clients) {
        const sec = CONFIG.sectors[cl.sector];
        const c = el("div", "card client");
        c.innerHTML = `<div class="cinfo"><b>${cl.name}</b><span class="kind">${sec.label} · ${CONFIG.sizes[cl.size].label}</span><span class="ctasks">${types(cl.types)}</span>
          <i class="bar sat"><b></b></i><span class="satline"></span></div>`;
        const bar = c.querySelector(".sat b"), line = c.querySelector(".satline");
        live(() => {
          const s = cl.sat;
          bar.style.width = s + "%";
          bar.style.background = s >= 50 ? "var(--v)" : s >= 25 ? "var(--m)" : "#ff5d7a";
          setText(line, `${mood(s)} · ${Math.round(s)} % · ${fmt2(clientIncome(cl))} EUR / s`);
        });
        r.append(c);
      }
    });
  },
  update() { this.view.update(); },
};
