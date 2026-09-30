// Bureau K'X en pixel art (canvas basse resolution, agrandi sans lissage).
import { state, deskLevel } from "./state.js";

const W = 160, H = 72;
const C = {
  n1: "#090615", n2: "#1E1142", n3: "#2E1766",
  v: "#9A6BFF", m: "#D36BFF", l: "#ECE6FA", or: "#FFD479",
};

let cv, g;
export const deskFx = { windowOpen: 0 };   // 0..1, anime par Jadd (etape 6)

export function initRender(canvas) {
  cv = canvas; cv.width = W; cv.height = H;
  g = cv.getContext("2d");
  g.imageSmoothingEnabled = false;
}

const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

function monitor(x, y, t, on = true) {
  r(x, y, 26, 18, C.n1);
  r(x + 1, y + 1, 24, 14, C.n3);
  if (on) {
    for (let i = 0; i < 4; i++) {
      const w = 6 + ((i * 7 + Math.floor(t / 900)) % 14);
      r(x + 3, y + 3 + i * 3, w, 1, i % 2 ? C.v : C.m);
    }
  }
  r(x + 11, y + 15, 4, 4, C.n1);
  r(x + 7, y + 18, 12, 2, C.n1);
}

function server(x, y, t) {
  r(x, y, 14, 30, C.n1);
  for (let i = 0; i < 5; i++) {
    r(x + 1, y + 2 + i * 6, 12, 4, C.n3);
    const on = Math.floor(t / 300 + i * 2 + x) % 3 !== 0;
    r(x + 2, y + 3 + i * 6, 2, 2, on ? C.m : C.n2);
    r(x + 5, y + 3 + i * 6, 2, 2, i % 2 ? C.v : C.n2);
  }
}

// Jadd, pres de la fenetre : silhouette pixel, bras leve quand il l'ouvre
function jadd(open) {
  const x = 128, y = 30;
  r(x + 2, y, 6, 6, "#d9a27a");            // tete
  r(x + 1, y - 1, 8, 3, C.n1);             // cheveux boucles
  r(x + 2, y + 2, 1, 1, C.n1); r(x + 6, y + 2, 1, 1, C.n1);
  r(x + 1, y + 6, 8, 10, C.n3);            // veste
  r(x + 4, y + 6, 2, 10, C.l);             // chemise
  r(x + 1, y + 16, 3, 6, C.n1); r(x + 6, y + 16, 3, 6, C.n1);   // jambes
  if (open > 0.05) { r(x + 9, y + 2, 2, 5, C.n3); r(x + 10, y - 4, 2, 6, "#d9a27a"); }  // bras leve
  else r(x + 9, y + 7, 2, 7, C.n3);
}

export function draw(t) {
  if (!g) return;
  const lvl = deskLevel();
  const heat = state.heat / 100;

  // mur + plancher
  r(0, 0, W, H, C.n2);
  r(0, 44, W, 1, C.n3);
  r(0, 45, W, H - 45, C.n1);
  for (let x = 0; x < W; x += 16) r(x, 46, 1, H - 46, C.n2);

  // fenetre (le battant s'ouvre quand Jadd agit)
  const fx = 122, fy = 8;
  r(fx - 2, fy - 2, 34, 34, C.v);
  r(fx, fy, 30, 30, C.n1);
  for (let i = 0; i < 6; i++) r(fx + 3 + ((i * 11) % 24), fy + 3 + ((i * 7) % 22), 1, 1, C.l);
  r(fx + 14, fy, 2, 30, C.v);
  const open = deskFx.windowOpen;
  if (open > 0) r(fx, fy, Math.round(14 * (1 - open)) + 2, 30, C.n3);

  // affiche K'X
  r(14, 8, 28, 20, C.n3); r(15, 9, 26, 18, C.n1);
  r(19, 12, 2, 11, C.m);
  for (let i = 0; i < 5; i++) { r(21 + i, 17 - i, 2, 2, C.m); r(21 + i, 17 + i, 2, 2, C.m); }
  for (let i = 0; i < 6; i++) { r(30 + i, 12 + i * 2, 2, 2, C.or); r(35 - i, 12 + i * 2, 2, 2, C.or); }

  // serveurs (achetes)
  if (state.servers >= 1) server(6, 32, t);
  if (state.servers >= 2) server(22, 32, t);
  if (state.servers >= 3) server(146, 42, t);

  // bureau
  r(30, 52, 100, 4, C.v);
  r(30, 56, 100, 1, C.n3);
  r(34, 57, 4, 15, C.n3); r(122, 57, 4, 15, C.n3);

  // ecrans
  if (lvl === 0) monitor(67, 31, t);
  else if (lvl === 1) { monitor(54, 31, t); monitor(80, 31, t); }
  else { monitor(40, 31, t); monitor(67, 31, t); monitor(94, 31, t); }

  // clavier, tasse, plante
  r(66, 49, 28, 3, C.n1); r(67, 50, 26, 1, C.n3);
  r(122, 46, 5, 6, C.l); r(127, 47, 2, 3, C.l);
  r(31, 44, 6, 8, C.n3); r(32, 38, 2, 6, C.v); r(34, 40, 3, 2, C.m);

  if (state.team.jadd.on) jadd(open);

  // chaleur : voile rouge et air qui tremble
  if (heat > 0.35) {
    g.fillStyle = `rgba(255,93,122,${(heat - 0.35) * 0.22})`;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(236,230,250,0.35)";
    for (let i = 0; i < 6; i++) {
      const x = 36 + i * 14, y = 20 - ((t / 90 + i * 7) % 18);
      g.fillRect(x + Math.round(Math.sin(t / 300 + i) * 2), y + 24, 1, 3);
    }
  }
}
