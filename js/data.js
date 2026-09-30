// Chargement des donnees (noms et profils) depuis le dossier data/.
// Pour ajouter un employe : editer data/employees.json, rien d'autre.
import { CONFIG } from "./config.js";

export const DATA = { employees: [], byId: {} };

async function getJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " : " + r.status);
  return r.json();
}

export async function loadData() {
  try {
    const [emp, dir] = await Promise.all([getJSON("data/employees.json"), getJSON("data/directors.json")]);
    DATA.employees = emp.employees.map((e) => ({ ...e, name: `${e.prenom} ${e.nom}`.trim() }));
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

export const initials = (e) => (e.prenom[0] + (e.nom ? e.nom[0] : "")).toUpperCase();
