import { state } from "./state.js";

let ctx = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// notes: [frequence Hz, duree s], forme d'onde carree = son chiptune
function play(notes, { type = "square", vol = 0.06 } = {}) {
  if (state.settings.muted) return;
  const c = ensure();
  if (!c) return;
  let t = c.currentTime;
  for (const [f, d] of notes) {
    if (f > 0) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + d);
    }
    t += d;
  }
}

export const sfx = {
  tap:     () => play([[660, 0.05]]),
  ok:      () => play([[523, 0.06], [784, 0.08]]),
  coin:    () => play([[988, 0.05], [1319, 0.12]]),
  error:   () => play([[220, 0.1], [165, 0.16]], { type: "sawtooth" }),
  alert:   () => play([[440, 0.08], [0, 0.04], [440, 0.08]]),
  unlock:  () => play([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.18]]),
  tab:     () => play([[440, 0.03]], { vol: 0.04 }),
};

export function setMuted(m) { state.settings.muted = m; }
export function unlockAudio() { ensure(); }
