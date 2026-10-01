// Publicite : campagnes pour trouver des clients et des employes.
import { CONFIG } from "./config.js";
import { state, shopDiscount } from "./state.js";
import { addSystem } from "./loop.js";
import { on } from "./events.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { DATA, getEmp, rollRarity, rarityIdx, applyRarity, rarityDef, luckNow } from "./data.js";
import { makeOffer } from "./clients.js";
import { cleanPhotos } from "./avatar.js";

const A = CONFIG.ads;
const rnd = (r) => r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));

// ---- campagne clients ----
export const isFirstAd = () => A.client.firstFree && state.stats.clientsSigned === 0 && state.offers.length === 0 && !state.stats.adsLaunched;
export const adIsFree = (which) => (which === "client" && isFirstAd()) || state.freeAds[which] > 0;     // premiere campagne ou campagnes de la boutique
export function clientAdCost() {
  if (adIsFree("client")) return 0;
  return Math.round(A.client.cost * (1 + A.client.perClient * state.clients.length) * (1 + A.client.cityBonus * state.city) * shopDiscount("adDiscount"));
}
export const recruitAdCost = (targeted = false) => (!targeted && adIsFree("recruit") ? 0 : Math.round(A.recruit.cost * (1 + A.recruit.cityBonus * state.city) * (targeted ? A.recruit.targetedMult : 1) * shopDiscount("adDiscount")));

// niveau maximal des profils propose selon la credibilite
export function maxTier() {
  let t = 1;
  const rb = 4 * (state.shop.tierCred || 0);          // boutique : meilleurs profils plus tot
  A.recruit.tierCred.forEach((c, i) => { if (state.credibility >= c - rb) t = i + 1; });
  return t;
}
// prochain niveau de profil a debloquer : { tier, cred } ou null
export function nextTier() {
  const t = maxTier();
  return t < A.recruit.tierCred.length ? { tier: t + 1, cred: A.recruit.tierCred[t] - 4 * (state.shop.tierCred || 0) } : null;
}

export const adLeft = (which) => (state.ads[which] ? Math.max(0, state.ads[which].end - state.stats.playSeconds) : 0);
export const adRunning = (which) => !!state.ads[which];

export function canClientAd() { return !adRunning("client") && state.offers.length < A.client.maxPending && state.money >= clientAdCost(); }
export function canRecruitAd(targeted = false) { return !adRunning("recruit") && state.candidates.length < A.recruit.maxPending && state.money >= recruitAdCost(targeted) && state.staff.length < staffCapNow(); }
const staffCapNow = () => CONFIG.office.levels[Math.min(state.office, CONFIG.office.levels.length - 1)].staff;

export function launchClientAd() {
  if (!canClientAd()) return false;
  const first = isFirstAd(), cost = clientAdCost();
  if (cost === 0 && !first && state.freeAds.client > 0) state.freeAds.client--;      // campagne offerte par la boutique
  state.money -= cost;
  state.stats.adsLaunched = (state.stats.adsLaunched || 0) + 1;
  const dur = first ? A.client.firstDurationSec : A.client.durationSec;
  state.ads.client = { end: state.stats.playSeconds + dur, total: dur };
  sfx.ok();
  return true;
}
export function launchRecruitAd(targeted = false) {
  if (!canRecruitAd(targeted)) return false;
  const cost = recruitAdCost(targeted);
  if (cost === 0 && !targeted && state.freeAds.recruit > 0) state.freeAds.recruit--;
  state.money -= cost;
  state.ads.recruit = { end: state.stats.playSeconds + A.recruit.durationSec, targeted: !!targeted };
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

// Cree un profil (stocke dans state.people) : meme tirage u pour le temps, la competence, l'embauche et le salaire.
function generateEmployee(tier, minRarity = null, luck = 0) {
  const G = A.recruit.generator[tier - 1], N = DATA.names;
  const u = Math.random(), lerp = (r, k = u) => r[0] + (r[1] - r[0]) * k;
  const id = "g" + state.nextPersonId++;
  const hireK = Math.min(1, Math.max(0, u + (Math.random() - 0.5) * 0.2));
  const e = {
    id, generated: true, tier, minCity: 0,
    prenom: N.prenoms[Math.floor(Math.random() * N.prenoms.length)], nom: N.noms[Math.floor(Math.random() * N.noms.length)],
    titre: N.titres[tier - 1][Math.floor(Math.random() * N.titres[tier - 1].length)],
    time: Math.round(lerp(G.time)), skill: Math.round(lerp(G.skill)),
    hire: Math.max(10, Math.round(lerp(G.hire, hireK) / 5) * 5), salary: +lerp(G.salary, hireK).toFixed(2),
  };
  e.name = `${e.prenom} ${e.nom}`;
  applyRarity(e, rollRarity(minRarity, luck));    // rarete : temps et competence x bonus
  state.people[id] = e;
  return e;
}

function finishRecruitAd(targeted) {
  const top = maxTier() + (targeted ? 1 : 0);
  let n = rnd(A.recruit.candidates) + (state.credibility >= A.recruit.bonusCred ? 1 : 0);
  n = Math.min(n, A.recruit.maxPending - state.candidates.length);
  // ticket de recrutement : le premier profil est au moins rare
  const ticket = n > 0 && state.tickets > 0;
  if (ticket) state.tickets--;
  let found = 0, best = null;
  for (let i = 0; i < n; i++) {
    const minR = ticket && i === 0 ? CONFIG.rarity.ticketMin : null;
    // niveau : favorise les plus hauts permis ; petite chance d'un niveau au-dessus
    let allowed = Math.min(5, top + (Math.random() < A.recruit.luckyChance ? 1 : 0));
    const weights = Array.from({ length: allowed }, (_, k) => (k + 1) * (k + 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), tier = 1;
    for (; tier < allowed; tier++) { if ((r -= weights[tier - 1]) < 0) break; }
    // profil nomme (data/employees.json) de ce niveau, sinon profil genere
    const named = DATA.employees.filter((e) => e.tier === tier && e.minCity <= state.city && !state.staff.includes(e.id) && !state.candidates.includes(e.id) && (!minR || rarityIdx(e.rarity) >= rarityIdx(minR)));
    let got;
    if (named.length && Math.random() < A.recruit.namedShare) { got = named[Math.floor(Math.random() * named.length)]; state.candidates.push(got.id); }
    else { got = generateEmployee(tier, minR, luckNow(targeted)); state.candidates.push(got.id); }
    if (!best || rarityIdx(got.rarity) > rarityIdx(best.rarity)) best = got;
    found++;
  }
  const star = best && rarityIdx(best.rarity) >= 3 ? ` Un profil ${rarityDef(best.rarity).label.toLowerCase()} : ${best.name} !` : "";
  toast(found ? `Campagne terminée : ${found} profil${found > 1 ? "s" : ""} à étudier.${star}` : "Campagne terminée : liste pleine.");
  sfx.coin();
}

let acc = 0;
function tick(dt) {
  const now = state.stats.playSeconds;
  if (state.ads.client && now >= state.ads.client.end) { state.ads.client = null; finishClientAd(); }
  if (state.ads.recruit && now >= state.ads.recruit.end) { const t = state.ads.recruit.targeted; state.ads.recruit = null; finishRecruitAd(t); }
  acc += dt;
  if (acc >= 2) { acc = 0; cleanPhotos(); }
}

on("agencyReset", () => { acc = 0; });
export function initAds() { addSystem(tick); }
