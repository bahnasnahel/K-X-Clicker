import { el, liveView, setText } from "../util.js";
import { CONFIG } from "../config.js";
import { state, gainMult } from "../state.js";
import { confirmDialog } from "../modal.js";
import { cityName, isLastCity, nextCity, threshold, canOpen, repGain, openAgency } from "../prestige.js";

const P = CONFIG.prestige;

export default {
  id: "agency", label: "Agence", icon: "agency",
  badge: () => canOpen(),
  mount(root) {
    this.view = liveView(root, () => JSON.stringify([state.city, canOpen(), state.reputation]), (r, live) => {
      r.append(el("h2", "h", "Agence"));
      r.append(el("div", "card citycard", `<b>K'X ${cityName()}</b><span class="kind">Réputation ${state.reputation} · gains +${Math.round((gainMult() - 1) * 100)} %</span>`));

      const prog = el("div", "card");
      prog.innerHTML = `<div class="cinfo"><b>Prochaine étape : ${isLastCity() ? "réouvrir à " + cityName() : "K'X " + cityName(nextCity())}</b>
        <i class="bar"><b></b></i><span class="satline"></span></div>`;
      const bar = prog.querySelector(".bar b"), line = prog.querySelector(".satline");
      live(() => {
        const t = threshold(), h = state.hoursRun;
        bar.style.width = Math.min(100, (h / t) * 100) + "%";
        setText(line, `${Math.floor(h)} / ${t} heures gagnées`);
      });
      r.append(prog);

      r.append(el("p", "muted", isLastCity()
        ? "Paris est la dernière ville de la V1. Tu peux la rouvrir pour gagner de la réputation. D'autres villes arriveront plus tard."
        : P.news[nextCity()]));
      r.append(el("p", "muted", `On repart de zéro (clients, workflows, argent). On garde l'équipe, les blocs, les succès et la réputation. Réputation gagnée en ouvrant maintenant : +${repGain()}. Chaque point : +${Math.round(P.repBonus * 100)} % de gains, clients plus gros et plus rapides.`));

      const b = el("button", "btn big", isLastCity() ? "Rouvrir l'agence" : `Ouvrir K'X ${cityName(nextCity())}`);
      b.disabled = !canOpen();
      b.onclick = async () => {
        const ok = await confirmDialog("Ouvrir une nouvelle agence ?", `Tes clients, workflows et ton argent seront remis à zéro. Tu gagnes +${repGain()} de réputation.`, "Ouvrir");
        if (ok) openAgency();
      };
      r.append(b);

      r.append(el("p", "qlabel", "Les villes"));
      P.cities.forEach((c, i) => {
        r.append(el("div", "card cityrow" + (i === state.city ? " cur" : i < state.city ? " done" : " todo"),
          `<b>${c}</b><span class="kind">${i < state.city ? "Ouverte" : i === state.city ? "Agence actuelle" : "À ouvrir"}</span>`));
      });
    });
  },
  update() { this.view.update(); },
};
