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
    DATA.employees = emp.employees.map((e) => applyRarity({ ...e, name: `${e.prenom} ${e.nom}`.trim() }, e.rarity || rollRarity(null, 0, hash01(e.id))));
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

// ---- Rarete (employes et clients) : commun, peu commun, rare, epique, legendaire, mythique, supreme ----
export const rarityDef = (id) => CONFIG.rarity.list.find((r) => r.id === id) || CONFIG.rarity.list[0];
export const rarityIdx = (id) => Math.max(0, CONFIG.rarity.list.findIndex((r) => r.id === id));
// chance : item "Chance" de la boutique (par x niveau), + celle d'une campagne ciblee
export const luckNow = (targeted = false) => ((state.shop.luck || 0) * CONFIG.shop.items.find((i) => i.id === "luck").per) / 100 + (targeted ? CONFIG.rarity.targetedLuck : 0);
// tirage : poids = chance x (1 + luck)^rang ; minId : rarete minimale (ticket de recrutement)
export function rollRarity(minId = null, luck = 0, rnd = Math.random()) {
  const L = CONFIG.rarity.list, from = minId ? rarityIdx(minId) : 0;
  const w = L.map((x, i) => (i < from ? 0 : x.chance * Math.pow(1 + luck, i)));
  let r = rnd * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) if ((r -= w[i]) < 0) return L[i].id;
  return L[from].id;
}
const half = (v) => Math.round(v * 2) / 2;                // arrondi a 0,5 pres
// employe : temps et competence x bonus de la rarete (competence max 10) ; embauche et salaire suivent, moins vite (exposant costExponent)
export function applyRarity(e, id) {
  const d = rarityDef(id);
  e.rarity = d.id;
  e.time = half(e.time * d.mult);
  e.skill = Math.min(10, half(e.skill * d.mult));
  const cost = Math.pow(d.mult, CONFIG.rarity.costExponent);
  e.hire = Math.max(5, Math.round(e.hire * cost));
  e.salary = +(e.salary * cost).toFixed(3);
  return e;
}
const hash01 = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };

export const initials = (e) => (e.prenom[0] + (e.nom ? e.nom[0] : "")).toUpperCase();
