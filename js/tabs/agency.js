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
    this.view = liveView(root, () => JSON.stringify([state.city, canOpen(), state.reputation, repGain()]), (r, live) => {
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

      // explication complete, avec les vrais chiffres
      const gain = repGain(), bonusNow = Math.round(state.reputation * P.repBonus * 100), bonusAfter = Math.round((state.reputation + gain) * P.repBonus * 100);
      const how = el("div", "card howcard");
      how.innerHTML = `<div class="credhead"><b>Comment ça marche ?</b></div>
        <p><b>1. Le but.</b> Les heures gagnées (qui viennent de tes automatisations) mesurent la progression de ton agence. Quand la barre ci-dessus est pleine, tu peux ouvrir K'X ${isLastCity() ? "à nouveau à " + cityName() : "dans la ville suivante : " + cityName(nextCity())}.</p>
        <p><b>2. Ce que tu perds.</b> Tu repars de zéro : argent, clients, employés, bureau, automatisations, stress, crédibilité.</p>
        <p><b>3. Ce que tu gardes.</b> Nahel, Yanis, Jadd et Noah avec leurs niveaux, tes succès, les explications déjà débloquées et ta <b>réputation</b>.</p>
        <p><b>4. La réputation, c'est quoi ?</b> Ce sont des points permanents. Tu en gagnes en ouvrant une agence : <b>heures gagnées ÷ ${P.repPerHours}</b>, au minimum 1. Aujourd'hui : <b>+${gain} point${gain > 1 ? "s" : ""}</b>.</p>
        <p><b>5. Ce qu'elle donne.</b> Chaque point = <b>+${Math.round(P.repBonus * 100)} % de gains</b> sur tout (tâches, abonnements, automatisations), des demandes de clients plus fréquentes et des clients plus gros. Ton bonus passerait de <b>+${bonusNow} %</b> à <b>+${bonusAfter} %</b>.</p>
        <p><b>6. Nouvelle ville.</b> De nouveaux types de tâches et de secteurs arrivent, mais les tâches sont plus difficiles dès le départ. ${isLastCity() ? "Paris est la dernière ville de cette version : tu peux la rouvrir pour gagner encore de la réputation." : P.news[nextCity()]}</p>`;
      r.append(how);

      const b = el("button", "btn big", isLastCity() ? "Rouvrir l'agence" : `Ouvrir K'X ${cityName(nextCity())}`);
      b.disabled = !canOpen();
      b.onclick = async () => {
        const ok = await confirmDialog("Ouvrir une nouvelle agence ?", `Tu perds : argent, clients, employés, bureau et automatisations. Tu gardes : la direction, les succès et la réputation. Tu gagnes +${repGain()} point${repGain() > 1 ? "s" : ""} de réputation, soit +${Math.round(repGain() * P.repBonus * 100)} % de gains en plus.`, "Ouvrir");
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
