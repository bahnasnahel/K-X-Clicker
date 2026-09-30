import { load, startAutosave } from "./state.js";
import { startLoop, addFrame } from "./loop.js";
import { initRender, draw } from "./render.js";
import { initUI, updateUI } from "./ui.js";
import { unlockAudio } from "./audio.js";
import { initTasks } from "./tasks.js";
import { state } from "./state.js";
import { CONFIG } from "./config.js";

load();
initTasks();
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

// mode test : ajoute ?debug a l'adresse pour manipuler l'etat depuis la console (window.kx)
if (location.search.includes("debug")) window.kx = { state, CONFIG };
