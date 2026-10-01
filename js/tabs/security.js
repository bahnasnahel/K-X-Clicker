import { el, fmt, liveView } from "../util.js";
import { CONFIG } from "../config.js";
import { state, securityScore } from "../state.js";
import { measureLvl, measureCost, measureMaxed, canBuyMeasure, buyMeasure, measureBlock } from "../security.js";

const S = CONFIG.security, A = CONFIG.attacks;
const pct = (v) => Math.round(v * 100);

export default {
  id: "security", label: "Sécurité", icon: "shield",
  badge: () => !!state.attack,
  mount(root) {
    const sig = () => JSON.stringify([
      state.sec, securityScore(), S.measures.map((m) => canBuyMeasure(m.id)), state.city,
    ]);
    this.view = liveView(root, sig, (r) => {
      r.append(el("h2", "h", "Sécurité"));

      // score de securite : exige par les gros clients
      const score = securityScore();
      const card = el("div", "card totalcard");
      card.innerHTML = `<span class="kind">Score de sécurité</span><b class="totval">${score} / 100</b><i class="bar"><b style="width:${score}%"></b></i>
        <span class="sdesc">Chaque mesure achetée le fait monter. Les gros clients en exigent un : sans lui, ils ne se présentent pas.</span>`;
      r.append(card);

      const tiers = el("div", "card tiercard");
      tiers.append(el("div", "credhead", "<b>Score exigé par rang de client</b>"));
      for (const z of Object.values(CONFIG.sizes)) {
        const ok = score >= z.minSec;
        tiers.append(el("div", "tierrow " + (ok ? "ok" : "lock"), `<b>${z.label}</b><span>${z.minSec ? (ok ? `${z.minSec} exigés : atteint` : `${z.minSec} exigés`) : "aucun score exigé"}</span>`));
      }
      r.append(tiers);

      // mesures permanentes
      r.append(el("p", "qlabel", "Mesures de sécurité"));
      for (const m of S.measures) {
        const lvl = measureLvl(m.id), K = m.kind && A.kinds[m.kind];
        const fx = K ? `${K.label} : ${pct(measureBlock(m.kind))} % bloqués` : "Aucune protection directe";
        const c = el("div", "card shoprow");
        c.innerHTML = `<span class="sinfo"><b>${m.label} · niveau ${lvl} / ${m.max}</b><span class="sdesc">${m.desc}</span><span class="sdesc">${fx} · +${m.pts} de score par niveau</span></span>`;
        if (measureMaxed(m.id)) c.append(el("span", "fx", "Maximum"));
        else {
          const b = el("button", "btn small-btn", `Acheter<br><small>${fmt(measureCost(m.id))} EUR</small>`);
          b.disabled = !canBuyMeasure(m.id);
          b.onclick = () => buyMeasure(m.id);
          c.append(b);
        }
        r.append(c);
      }
      r.append(el("p", "muted small", "Les mesures et le score sont propres à chaque agence, et repartent de zéro quand tu la remets à zéro."));
    });
  },
  update() { this.view.update(); },
};
