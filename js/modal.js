import { el } from "./util.js";

// Fenetres modales simples, basees sur des promesses.
export function modal(build) {
  return new Promise((resolve) => {
    const ov = el("div", "overlay");
    const box = el("div", "modal");
    const close = (v) => { ov.remove(); resolve(v); };
    build(box, close);
    ov.append(box);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(null); });
    document.body.append(ov);
  });
}

export function confirmDialog(title, text, okLabel = "Confirmer") {
  return modal((box, close) => {
    box.append(el("h3", "h", title), el("p", "", text));
    const row = el("div", "row");
    const no = el("button", "btn ghost", "Annuler"), ok = el("button", "btn danger", okLabel);
    no.onclick = () => close(false); ok.onclick = () => close(true);
    row.append(no, ok); box.append(row);
  });
}

export function infoDialog(title, html, okLabel = "OK") {
  return modal((box, close) => {
    box.append(el("h3", "h", title));
    box.append(el("div", "mbody", html));
    const ok = el("button", "btn", okLabel); ok.onclick = () => close(true);
    box.append(ok);
  });
}
