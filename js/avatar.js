// Cadres photo : vraies photos pour les directeurs, initiales colorees pour les employes.
import { portrait } from "./bubbles.js";
import { initials } from "./data.js";

export function avatar(p, cls = "") {
  if (p.isNahel) return portrait("nahel", cls);
  return `<span class="frame ini tier${p.tier || 1} ${cls}"><b>${initials(p)}</b></span>`;
}
