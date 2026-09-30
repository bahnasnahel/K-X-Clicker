import { el } from "./util.js";

let box;

// Petit message temporaire en haut de l'ecran (deblocages, evenements).
export function toast(text, ms = 3200) {
  if (!box) { box = el("div"); box.id = "toasts"; document.body.append(box); }
  while (box.children.length >= 3) box.firstChild.remove();
  const t = el("div", "toast");
  t.textContent = text;
  box.append(t);
  setTimeout(() => t.remove(), ms);
}
