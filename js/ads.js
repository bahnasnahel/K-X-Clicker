// Publicite : campagnes pour trouver des clients et des employes.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { DATA } from "./data.js";
import { makeOffer } from "./clients.js";
import { cleanPhotos } from "./avatar.js";

const A = CONFIG.ads;
const rnd = (r) => r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));

// ---- campagne clients ----
export const isFirstAd = () => A.client.firstFree && state.stats.clientsSigned === 0 && state.offers.length === 0 && !state.stats.adsLaunched;
export function clientAdCost() {
  if (isFirstAd()) return 0;
  return Math.round(A.client.cost * (1 + A.client.perClient * state.clients.length) * (1 + A.client.cityBonus * state.city));
}
export const recruitAdCost = () => Math.round(A.recruit.cost * (1 + A.recruit.cityBonus * state.city));

// niveau maximal des profils propose selon la credibilite
export function maxTier() {
  let t = 1;
  A.recruit.tierCred.forEach((c, i) => { if (state.credibility >= c) t = i + 1; });
  return t;
}

export const adLeft = (which) => (state.ads[which] ? Math.max(0, state.ads[which].end - state.stats.playSeconds) : 0);
export const adRunning = (which) => !!state.ads[which];

export function canClientAd() { return !adRunning("client") && state.offers.length < A.client.maxPending && state.money >= clientAdCost(); }
export function canRecruitAd() { return !adRunning("recruit") && state.candidates.length < A.recruit.maxPending && state.money >= recruitAdCost() && state.staff.length < staffCapNow(); }
const staffCapNow = () => CONFIG.office.levels[Math.min(state.office, CONFIG.office.levels.length - 1)].staff;

export function launchClientAd() {
  if (!canClientAd()) return false;
  state.money -= clientAdCost();
  state.stats.adsLaunched = (state.stats.adsLaunched || 0) + 1;
  state.ads.client = { end: state.stats.playSeconds + A.client.durationSec };
  sfx.ok();
  return true;
}
export function launchRecruitAd() {
  if (!canRecruitAd()) return false;
  state.money -= recruitAdCost();
  state.ads.recruit = { end: state.stats.playSeconds + A.recruit.durationSec };
  sfx.ok();
  return true;
}

export function dismissCandidate(id) {
  state.candidates = state.candidates.filter((x) => x !== id);
  cleanPhotos();
}

function finishClientAd() {
  let n = rnd(A.client.offers) + (state.credibility >= A.client.bonusCred ? 1 : 0);
  n = Math.min(n, A.client.maxPending - state.offers.length);
  for (let i = 0; i < n; i++) state.offers.push(makeOffer());
  toast(n ? `Campagne terminée : ${n} demande${n > 1 ? "s" : ""} de clients.` : "Campagne terminée : aucune place pour de nouvelles demandes.");
  sfx.coin();
}

function finishRecruitAd() {
  const t = maxTier();
  const pool = DATA.employees.filter((e) => e.tier <= t && e.minCity <= state.city && !state.staff.includes(e.id) && !state.candidates.includes(e.id));
  let n = rnd(A.recruit.candidates) + (state.credibility >= A.recruit.bonusCred ? 1 : 0);
  n = Math.min(n, A.recruit.maxPending - state.candidates.length, pool.length);
  // on tire en favorisant les profils les plus forts permis par la credibilite
  for (let i = 0; i < n; i++) {
    const weights = pool.map((e) => 1 + e.tier);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), k = 0;
    for (; k < pool.length - 1; k++) { if ((r -= weights[k]) < 0) break; }
    state.candidates.push(pool.splice(k, 1)[0].id);
  }
  toast(n ? `Campagne terminée : ${n} profil${n > 1 ? "s" : ""} à étudier.` : "Campagne terminée : personne ne correspond pour le moment.");
  sfx.coin();
}

let acc = 0;
function tick(dt) {
  const now = state.stats.playSeconds;
  if (state.ads.client && now >= state.ads.client.end) { state.ads.client = null; finishClientAd(); }
  if (state.ads.recruit && now >= state.ads.recruit.end) { state.ads.recruit = null; finishRecruitAd(); }
  acc += dt;
  if (acc >= 2) { acc = 0; cleanPhotos(); }
}

on("agencyReset", () => { acc = 0; });
export function initAds() { addSystem(tick); }
