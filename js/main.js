import { state, load, startAutosave } from "./state.js";
import { startLoop, addFrame, runSystems } from "./loop.js";
import { CONFIG } from "./config.js";
import { initRender, draw } from "./render.js";
import { initUI, updateUI } from "./ui.js";
import { unlockAudio } from "./audio.js";
import { initWorkflows } from "./workflows.js";
import { initTasks } from "./tasks.js";
import { initClients } from "./clients.js";
import { initCrew } from "./crew.js";
import { initAchievements } from "./achievements.js";
import { checkOffline } from "./offline.js";
import { startTutorial } from "./tutorial.js";
import { loadData } from "./data.js";
import { initStaff } from "./staff.js";
import { initUnlocks } from "./unlocks.js";
import { initLawsuit } from "./lawsuit.js";
import { initAds } from "./ads.js";

await loadData();
load();
initWorkflows();
initTasks();
initClients();
initCrew();
initStaff();
initAds();
initLawsuit();
initUnlocks();
initAchievements();
initRender(document.getElementById("desk"));
initUI();
addFrame((t) => { draw(t); updateUI(); });
startAutosave();
startLoop();

checkOffline();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkOffline();
});
if (!state.settings.tutorialDone) setTimeout(startTutorial, 400);

// le navigateur exige un geste pour lancer l'audio
window.addEventListener("pointerdown", unlockAudio, { once: true });

// PWA : hors ligne + mise a jour automatique
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").then((reg) => {
    // cherche une nouvelle version au retour dans l'application
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) location.reload();
  });
}

// mode test : ajoute ?debug a l'adresse pour manipuler l'etat depuis la console (window.kx)
if (location.search.includes("debug")) window.kx = { state, CONFIG, runSystems };
