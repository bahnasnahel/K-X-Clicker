// Bureau K'X en pixel art (canvas basse resolution, agrandi sans lissage).
// Il change avec le niveau du bureau (state.office) et montre l'equipe (state.staff).
import { state } from "./state.js";
import { getEmp } from "./data.js";

const W = 160, H = 72;
const C = {
  n1: "#090615", n2: "#1E1142", n3: "#2E1766",
  v: "#9A6BFF", m: "#D36BFF", l: "#ECE6FA", or: "#FFD479",
};
const TIER = ["#b9a3ee", "#9A6BFF", "#D36BFF", "#ECE6FA", "#FFD479"];

let cv, g;
// windowOpen : 0..1 (Jadd ouvre la fenetre) ; passer : { kind, p } quelque chose passe devant la fenetre
export const deskFx = { windowOpen: 0, passer: null };

export function initRender(canvas) {
  cv = canvas; cv.width = W; cv.height = H;
  g = cv.getContext("2d");
  g.imageSmoothingEnabled = false;
}

const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

function monitor(x, y, t) {
  r(x, y, 26, 18, C.n1);
  r(x + 1, y + 1, 24, 14, C.n3);
  for (let i = 0; i < 4; i++) {
    const w = 6 + ((i * 7 + Math.floor(t / 900)) % 14);
    r(x + 3, y + 3 + i * 3, w, 1, i % 2 ? C.v : C.m);
  }
  r(x + 11, y + 15, 4, 4, C.n1);
  r(x + 7, y + 18, 12, 2, C.n1);
}

function person(x, y, col) {           // petit collegue
  r(x + 1, y, 4, 4, "#d9a27a");
  r(x, y + 4, 6, 7, col);
  r(x, y + 11, 2, 3, C.n1); r(x + 4, y + 11, 2, 3, C.n1);
}

// Jadd, pres de la fenetre : silhouette pixel, bras leve quand il ouvre
function jadd(open) {
  const x = 128, y = 30;
  r(x + 2, y, 6, 6, "#d9a27a");
  r(x + 1, y - 1, 8, 3, C.n1);
  r(x + 2, y + 2, 1, 1, C.n1); r(x + 6, y + 2, 1, 1, C.n1);
  r(x + 1, y + 6, 8, 10, C.n3);
  r(x + 4, y + 6, 2, 10, C.l);
  r(x + 1, y + 16, 3, 6, C.n1); r(x + 6, y + 16, 3, 6, C.n1);
  if (open > 0.05) { r(x + 9, y + 2, 2, 5, C.n3); r(x + 10, y - 4, 2, 6, "#d9a27a"); }
  else r(x + 9, y + 7, 2, 7, C.n3);
}

// ce qui passe devant la fenetre
function passer(fx, fy, t) {
  const p = deskFx.passer;
  if (!p) return;
  g.save(); g.beginPath(); g.rect(fx, fy, 30, 30); g.clip();
  const x = fx - 10 + p.p * 50;
  switch (p.kind) {
    case "oiseau": { const y = fy + 9 + Math.round(Math.sin(t / 120) * 2), up = Math.floor(t / 150) % 2; r(x + 2, y + 1, 4, 2, C.l); r(x, y + (up ? 0 : 2), 2, 1, C.l); r(x + 6, y + (up ? 0 : 2), 2, 1, C.l); r(x + 8, y + 1, 1, 1, C.or); break; }
    case "avion":  { const y = fy + 6; r(x, y + 1, 10, 2, C.m); r(x + 7, y - 1, 2, 2, C.m); r(x + 3, y + 3, 4, 1, C.m); break; }
    case "nuage":  { const y = fy + 12; r(x + 2, y, 8, 3, C.l); r(x, y + 2, 12, 3, C.l); r(x + 4, y - 2, 4, 3, C.l); break; }
    case "ballon": { const y = fy + 8 + Math.round(Math.sin(t / 400) * 2); r(x + 1, y, 5, 6, C.m); r(x, y + 1, 7, 3, C.m); r(x + 3, y + 6, 1, 5, C.l); break; }
  }
  g.restore();
}

export function draw(t) {
  if (!g) return;
  const lvl = Math.min(state.office, 4);

  // mur + plancher
  r(0, 0, W, H, C.n2);
  r(0, 44, W, 1, C.n3);
  r(0, 45, W, H - 45, C.n1);
  for (let x = 0; x < W; x += 16) r(x, 46, 1, H - 46, C.n2);
  if (lvl >= 3) { r(0, 62, W, 10, C.n2); r(0, 62, W, 1, C.n3); }       // moquette

  // fenetre (le battant s'ouvre quand Jadd agit)
  const fx = 122, fy = 8;
  r(fx - 2, fy - 2, 34, 34, C.v);
  r(fx, fy, 30, 30, C.n1);
  for (let i = 0; i < 6; i++) r(fx + 3 + ((i * 11) % 24), fy + 3 + ((i * 7) % 22), 1, 1, C.l);
  passer(fx, fy, t);
  r(fx + 14, fy, 2, 30, C.v);
  const open = deskFx.windowOpen;
  if (open > 0) r(fx, fy, Math.round(14 * (1 - open)) + 2, 30, C.n3);

  // affiche K'X (doree au dernier niveau)
  r(14, 8, 28, 20, lvl >= 4 ? C.or : C.n3); r(15, 9, 26, 18, C.n1);
  r(19, 12, 2, 11, C.m);
  for (let i = 0; i < 5; i++) { r(21 + i, 17 - i, 2, 2, C.m); r(21 + i, 17 + i, 2, 2, C.m); }
  for (let i = 0; i < 6; i++) { r(30 + i, 12 + i * 2, 2, 2, C.or); r(35 - i, 12 + i * 2, 2, 2, C.or); }

  // etagere (niveau 1 et plus)
  if (lvl >= 1 && lvl < 4) {
    r(58, 22, 44, 2, C.v);
    for (let i = 0; i < 9; i++) r(60 + i * 4, 13 + (i % 3), 3, 9 - (i % 3), [C.m, C.v, C.l][i % 3]);
  }
  // grand ecran mural (dernier niveau)
  if (lvl >= 4) {
    r(54, 4, 52, 26, C.v); r(55, 5, 50, 24, C.n1);
    for (let i = 0; i < 10; i++) { const h = 4 + ((i * 7 + Math.floor(t / 700)) % 14); r(58 + i * 4.6, 27 - h, 3, h, i % 2 ? C.m : C.v); }
  }
  // lumieres au plafond
  if (lvl >= 3) { r(30, 0, 14, 2, C.l); r(80, 0, 14, 2, C.l); r(130, 0, 14, 2, C.l); }

  // bureau
  if (lvl === 0) { r(50, 52, 60, 4, C.v); r(50, 56, 60, 1, C.n3); r(54, 57, 4, 15, C.n3); r(102, 57, 4, 15, C.n3); }
  else { r(30, 52, 100, 4, C.v); r(30, 56, 100, 1, C.n3); r(34, 57, 4, 15, C.n3); r(122, 57, 4, 15, C.n3); }

  // ecrans
  if (lvl === 0) monitor(67, 31, t);
  else if (lvl === 1) { monitor(54, 31, t); monitor(80, 31, t); }
  else { monitor(40, 31, t); monitor(67, 31, t); monitor(94, 31, t); }

  // poste de travail a gauche (niveau 2 et plus)
  if (lvl >= 2) { r(2, 52, 26, 3, C.v); r(4, 55, 3, 17, C.n3); r(23, 55, 3, 17, C.n3); r(8, 38, 14, 11, C.n1); r(9, 39, 12, 8, C.n3); r(10, 41, 7, 1, C.m); r(10, 44, 9, 1, C.v); }

  // clavier, tasse, plante
  r(66, 49, 28, 3, C.n1); r(67, 50, 26, 1, C.n3);
  if (lvl >= 1) { r(122, 46, 5, 6, C.l); r(127, 47, 2, 3, C.l); }
  r(31, 44, 6, 8, C.n3); r(32, 38, 2, 6, C.v); r(34, 40, 3, 2, C.m);
  if (lvl >= 3) { r(148, 56, 8, 10, C.n3); r(150, 46, 2, 10, C.v); r(146, 50, 4, 2, C.m); r(152, 48, 4, 2, C.v); }

  // l'equipe : un petit personnage par employe (couleur = niveau du profil)
  const n = Math.min(state.staff.length, 10);
  for (let i = 0; i < n; i++) { const e = getEmp(state.staff[i]); person(40 + i * 11, 56, TIER[(e ? e.tier : 1) - 1]); }

  if (state.team.jadd.on) jadd(open);
}
