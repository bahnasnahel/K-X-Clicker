// Explications avec la photo d'un membre de l'equipe. Le jeu est en PAUSE tant qu'une explication est ouverte.
import { el } from "./util.js";
import { CONFIG } from "./config.js";
import { state, save } from "./state.js";
import { portrait } from "./bubbles.js";
import { sfx } from "./audio.js";

// Une explication : retourne une promesse resolue a la fermeture ("skip" si on passe le tutoriel).
export function explain(who, text, { title = "", button = "Compris", count = null, skippable = false } = {}) {
  return new Promise((resolve) => {
    const box = el("div", "tuto");
    box.innerHTML = `<div class="tbody">${portrait(who, "active")}<p><b>${CONFIG.team[who].name}</b>${title ? `<strong>${title}</strong>` : ""}${text}</p></div>
      <div class="tfoot"><span>${count || ""}</span>${skippable ? '<button class="btn skip">Passer</button>' : ""}<button class="btn next">${button}</button></div>`;
    document.body.append(box);
    sfx.unlock();
    const done = (v) => { box.remove(); resolve(v); };
    box.querySelector(".next").onclick = () => { sfx.tap(); done("next"); };
    const sk = box.querySelector(".skip");
    if (sk) sk.onclick = () => done("skip");
  });
}

// Tutoriel de depart (2 bulles)
export async function startTutorial() {
  const steps = CONFIG.tutorial;
  for (let i = 0; i < steps.length; i++) {
    const r = await explain(steps[i].who, steps[i].text, { button: i === steps.length - 1 ? "Jouer" : "Suivant", count: `${i + 1} / ${steps.length}`, skippable: true });
    if (r === "skip") break;
  }
  state.settings.tutorialDone = true;
  save();
}
