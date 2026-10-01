import { el, fmt, liveView } from "../util.js";
import { CONFIG } from "../config.js";
import { state, securityScore } from "../state.js";
import { measureLvl, measureCost, measureMaxed, canBuyMeasure, buyMeasure, measureBlock, enemyCap, enemyLabel, styleOf, huntTarget, huntSpeed, huntMode, setHuntMode, MODES, bounty } from "../security.js";

const S = CONFIG.security, A = CONFIG.attacks, E = CONFIG.enemies;
const pct = (v) => Math.round(v * 100);

export default {
  id: "security", label: "Sécurité", icon: "shield",
  badge: () => !!state.attack,
  mount(root) {
    const sig = () => JSON.stringify([
      state.sec, securityScore(), S.measures.map((m) => canBuyMeasure(m.id)), state.team.noah, state.city, state.stats.attacksRepelled, state.enemies.map((e) => e.id), huntMode(),
    ]);
    this.view = liveView(root, sig, (r, live) => {
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

      // Noah : sa partie direction (il traque les ennemis)
      const n = state.team.noah;
      const nc = el("div", "card tiercard");
      nc.append(el("div", "credhead", "<b>Noah, direction</b>"));
      nc.append(el("span", "sdesc", n.on
        ? `Niveau ${n.lvl} : il traque ${huntSpeed().toFixed(1).replace(".", ",")} point${huntSpeed() >= 2 ? "s" : ""} par seconde. Chaque ennemi détruit te rapporte de l'argent.`
        : "Il arrive dès que la sécurité est introduite."));
      nc.append(el("span", "sdesc", "Qui vise-t-il en priorité ?"));
      const row = el("div", "row");
      row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
      for (const [id, txt] of Object.entries(MODES)) {
        const b = el("button", id === huntMode() ? "btn small-btn" : "btn small-btn ghost", txt);
        b.style.cssText = "flex:1;min-width:96px;margin:0";
        b.onclick = () => setHuntMode(id);
        row.append(b);
      }
      nc.append(row);
      r.append(nc);

      // ennemis actifs
      r.append(el("div", "qhead", `<h2 class="h">Ennemis</h2><span class="qcount">${state.enemies.length} / ${enemyCap()}</span>`));
      r.append(el("p", "muted small", "Plus tu gagnes d'argent, plus des ennemis voudront t'attaquer, et plus ils sont forts. Chacun a son style. Noah les détruit un par un."));
      if (!state.enemies.length) r.append(el("p", "muted", "Aucun ennemi pour le moment."));
      for (const e of state.enemies) {
        const st = styleOf(e), K = A.kinds[e.kind];
        const c = el("div", "card client");
        c.innerHTML = `<span class="cinfo"><b>${e.name}</b><span class="kind">${enemyLabel(e)} (niveau ${e.lvl}) · ${st.label}</span>
          <span class="sdesc">${st.desc} Sorte favorite : ${K.label}. Puissance ${e.power}. Butin : ${fmt(bounty(e))} EUR.</span>
          <i class="bar"><b></b></i><span class="satline"></span></span>`;
        const bar = c.querySelector(".bar b"), line = c.querySelector(".satline");
        live(() => {
          bar.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + "%";
          const tg = huntTarget(), t = tg && tg.id === e.id;
          line.textContent = t ? "Noah le traque" : "En attente";
        });
        r.append(c);
      }

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
