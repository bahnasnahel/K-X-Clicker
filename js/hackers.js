// Hackers : Noah (sa traque) et la liste des ennemis. Affiche dans le panneau « Hackers » en haut de l'ecran (voir panels.js).
import { el, fmt } from "./util.js";
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { enemyCap, enemyLabel, styleOf, huntTargets, huntCount, huntSpeed, huntMode, setHuntMode, MODES, bounty } from "./security.js";

const A = CONFIG.attacks;

export const hackersSig = () => JSON.stringify([state.team.noah, huntCount(), state.enemies.map((e) => e.id), huntMode()]);

export function renderHackers(r, live) {
  // Noah : sa partie direction (il traque les ennemis)
  const n = state.team.noah;
  const nc = el("div", "card tiercard");
  nc.append(el("div", "credhead", "<b>Noah, direction</b>"));
  nc.append(el("span", "sdesc", n.on
    ? `Niveau ${n.lvl} : il traque ${huntSpeed().toFixed(1).replace(".", ",")} point${huntSpeed() >= 2 ? "s" : ""} par seconde, sur ${huntCount()} ennemi${huntCount() > 1 ? "s" : ""} à la fois (un de plus tous les ${CONFIG.team.noah.huntEvery} niveaux). Chaque ennemi détruit te rapporte de l'argent.`
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
  r.append(el("p", "muted small", "Plus tu gagnes d'argent, plus des ennemis voudront t'attaquer, et plus ils sont forts. Chacun a son style. Noah les détruit."));
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
      const t = huntTargets().some((x) => x.id === e.id);
      line.textContent = t ? "Noah le traque" : "En attente";
    });
    r.append(c);
  }
}
