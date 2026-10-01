// Chargement des donnees (noms et profils) depuis le dossier data/.
// Pour ajouter un employe : editer data/employees.json, rien d'autre.
import { CONFIG } from "./config.js";
import { state } from "./state.js";

export const DATA = { employees: [], byId: {}, photos: [], names: { prenoms: ["Alex"], noms: ["Martin"], titres: [["Stagiaire"], ["Assistant"], ["Technicien"], ["Chef de projet"], ["Expert"]] } };

// Un employe : profil nomme (data/employees.json) ou profil genere (state.people)
export const getEmp = (id) => DATA.byId[id] || (state.people && state.people[id]) || null;

async function getJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " : " + r.status);
  return r.json();
}

export async function loadData() {
  try {
    const [emp, dir, ph, nm] = await Promise.all([getJSON("data/employees.json"), getJSON("data/directors.json"), getJSON("data/photos.json"), getJSON("data/names.json")]);
    DATA.photos = ph.photos;
    DATA.names = nm;
    // rarete : celle du fichier ("rarity"), sinon tiree une fois pour toutes a partir de l'id (toujours la meme)
    DATA.employees = emp.employees.map((e) => applyRarity({ ...e, name: `${e.prenom} ${e.nom}`.trim() }, e.rarity || rollRarity(null, hash01(e.id))));
    DATA.byId = Object.fromEntries(DATA.employees.map((e) => [e.id, e]));
    for (const d of dir.directors) {
      if (!CONFIG.team[d.id]) continue;
      CONFIG.team[d.id].name = `${d.prenom} ${d.nom}`.trim();
      CONFIG.team[d.id].role = d.titre;
    }
  } catch (e) {
    console.warn("Données illisibles", e);
  }
}

// ---- Rarete des profils de recrutement (commun, rare, epique, legendaire) ----
export const rarityDef = (id) => CONFIG.rarity.list.find((r) => r.id === id) || CONFIG.rarity.list[0];
export const rarityIdx = (id) => Math.max(0, CONFIG.rarity.list.findIndex((r) => r.id === id));
// tirage selon les chances ; minId : rarete minimale (ticket de recrutement)
export function rollRarity(minId = null, rnd = Math.random()) {
  const pool = CONFIG.rarity.list.slice(minId ? rarityIdx(minId) : 0);
  let r = rnd * pool.reduce((s, x) => s + x.chance, 0);
  for (const x of pool) if ((r -= x.chance) < 0) return x.id;
  return pool[0].id;
}
// la rarete donne un bonus de temps et de competence
export function applyRarity(e, id) {
  const d = rarityDef(id);
  e.rarity = d.id;
  e.time = Math.round(e.time * d.timeMult);
  e.skill = Math.min(10, e.skill + d.skillAdd);
  return e;
}
const hash01 = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };

export const initials = (e) => (e.prenom[0] + (e.nom ? e.nom[0] : "")).toUpperCase();
