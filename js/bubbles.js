// Bulles de dialogue avec la photo d'un membre de l'equipe.
import { el } from "./util.js";
import { CONFIG } from "./config.js";

let box, active = null, activeUntil = 0;

export const portrait = (id, cls = "") =>
  `<span class="frame ${cls}"><img src="assets/photos/${id}.webp" alt="" width="256" height="256" decoding="async"></span>`;

// personnage qui parle ou agit en ce moment (contour or)
export const activePerson = () => (Date.now() < activeUntil ? active : null);

export function bubble(who, text, ms = 3800) {
  if (!box) { box = el("div"); box.id = "bubbles"; document.body.append(box); }
  active = who; activeUntil = Date.now() + ms;
  const b = el("div", "bubble", `${portrait(who, "active")}<p><b>${CONFIG.team[who].name}</b>${text}</p>`);
  while (box.children.length >= 2) box.firstChild.remove();
  b.onclick = () => b.remove();            // un tap ferme la bulle
  box.append(b);
  setTimeout(() => b.remove(), ms);
}
