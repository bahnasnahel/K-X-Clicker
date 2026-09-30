// Photos : les directeurs ont leurs photos ; clients et employes recoivent au hasard une photo
// de data/photos.json, SANS doublon. S'il n'y en a plus de libre : pas de photo du tout.
import { state } from "./state.js";
import { DATA } from "./data.js";
import { portrait } from "./bubbles.js";

const frame = (file, cls) => `<span class="frame ${cls}"><img src="assets/photos/people/${file}.webp" alt="" width="256" height="256" decoding="async"></span>`;

export function photoFor(key) {
  if (state.photos[key]) return state.photos[key];
  const used = new Set(Object.values(state.photos));
  const free = DATA.photos.filter((p) => !used.has(p));
  if (!free.length) return null;
  const p = free[Math.floor(Math.random() * free.length)];
  state.photos[key] = p;
  return p;
}

// key : "e:<id>" pour un employe, "c:<id>" pour un client
export function avatar(p, cls = "", key = null) {
  if (p && p.isNahel) return portrait("nahel", cls);
  const file = key ? photoFor(key) : null;
  return file ? frame(file, cls) : "";
}

// libere les photos de ceux qui ne sont plus la
export function cleanPhotos() {
  const keep = new Set([
    ...state.clients.map((c) => "c:" + c.id), ...state.offers.map((o) => "c:" + o.id),
    ...state.staff.map((id) => "e:" + id), ...state.candidates.map((id) => "e:" + id),
  ]);
  for (const k of Object.keys(state.photos)) if (!keep.has(k)) delete state.photos[k];
}
