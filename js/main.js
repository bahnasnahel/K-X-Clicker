import { load, startAutosave } from "./state.js";
import { startLoop, addFrame } from "./loop.js";
import { initRender, draw } from "./render.js";
import { initUI, updateUI } from "./ui.js";
import { unlockAudio } from "./audio.js";

load();
initRender(document.getElementById("desk"));
initUI();
addFrame((t) => { draw(t); updateUI(); });
startAutosave();
startLoop();

// le navigateur exige un geste pour lancer l'audio
window.addEventListener("pointerdown", unlockAudio, { once: true });

// PWA : hors ligne + mise a jour automatique
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) location.reload();
  });
}
