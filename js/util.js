const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function fmt(n) {
  n = Math.floor(n);
  if (n < 1e6) return nf.format(n);
  const units = [[1e12, "T"], [1e9, "G"], [1e6, "M"]];
  for (const [v, s] of units) if (n >= v) return (n / v).toFixed(2).replace(".", ",") + s;
  return String(n);
}

export function fmtHours(h) {
  if (h < 10) return h.toFixed(1).replace(".", ",");
  return nf.format(Math.floor(h));
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

// Vue "vivante" : reconstruit le DOM seulement quand la signature change,
// et met a jour les petits champs dynamiques a chaque image.
export function liveView(root, getSig, build) {
  let last = null, live = [];
  return {
    update() {
      const s = getSig();
      if (s !== last) {
        last = s; live = [];
        root.replaceChildren();
        build(root, (fn) => live.push(fn));
      }
      for (const f of live) f();
    },
  };
}

// ecrit un texte seulement s'il change
export function setText(node, v) { if (node.textContent !== v) node.textContent = v; }

export const fmt1 = (n) => n.toFixed(1).replace(".", ",");
export const fmt2 = (n) => n.toFixed(2).replace(".", ",");
