// Petit tutoriel : 5 bulles maximum, avec les photos de l'equipe.
import { el } from "./util.js";
import { CONFIG } from "./config.js";
import { state, save } from "./state.js";
import { portrait } from "./bubbles.js";
import { sfx } from "./audio.js";

export function startTutorial() {
  const steps = CONFIG.tutorial;
  let i = 0;
  const box = el("div", "tuto");
  document.body.append(box);
  function show() {
    const s = steps[i];
    box.innerHTML = `<div class="tbody">${portrait(s.who, "active")}<p><b>${CONFIG.team[s.who].name}</b>${s.text}</p></div>
      <div class="tfoot"><span>${i + 1} / ${steps.length}</span><button class="btn skip">Passer</button><button class="btn next">${i === steps.length - 1 ? "Jouer" : "Suivant"}</button></div>`;
    box.querySelector(".skip").onclick = end;
    box.querySelector(".next").onclick = () => { sfx.tap(); if (++i >= steps.length) end(); else show(); };
  }
  function end() { box.remove(); state.settings.tutorialDone = true; save(); }
  show();
}
