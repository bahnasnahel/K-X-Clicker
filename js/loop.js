import { CONFIG } from "./config.js";
import { state } from "./state.js";

const systems = [];   // fn(dtSeconds) appelees a pas fixe
const frames = [];    // fn(nowMs) appelees a chaque image (rendu, UI)

export function addSystem(fn) { systems.push(fn); }
export function addFrame(fn) { frames.push(fn); }

export function startLoop() {
  const step = CONFIG.loop.stepMs;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);   // d'abord : une erreur ne doit pas figer le jeu
    let dt = now - last;
    last = now;
    if (dt > CONFIG.loop.maxCatchUpMs) dt = step;   // onglet reste en arriere-plan
    acc += dt;
    while (acc >= step) {
      const s = step / 1000;
      state.stats.playSeconds += s;
      for (const fn of systems) fn(s);
      acc -= step;
    }
    for (const fn of frames) fn(now);
  }
  requestAnimationFrame(frame);
}
