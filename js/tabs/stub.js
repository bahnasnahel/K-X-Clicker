import { el } from "../util.js";

// Onglet "bientot" : reserve l'emplacement, rempli aux etapes suivantes.
export function stubTab(id, label, icon, title, text) {
  return {
    id, label, icon,
    mount(root) {
      root.append(el("h2", "h", title), el("p", "muted", text));
    },
    update() {},
  };
}
