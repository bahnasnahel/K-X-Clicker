// Succes : conditions, bonus, notifications.
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { addSystem } from "./loop.js";
import { sfx } from "./audio.js";
import { toast } from "./toast.js";
import { activeCount } from "./workflows.js";

const team = () => state.team;
const COND = {
  first_task:   (s) => s.stats.tasksDone >= 1,
  tasks_25:     (s) => s.stats.tasksDone >= 25,
  tasks_200:    (s) => s.stats.tasksDone >= 200,
  first_client: (s) => s.stats.clientsSigned >= 1,
  five_clients: (s) => s.clients.length >= 5,
  ten_happy:    (s) => s.stats.clientsSatisfied >= 10,
  first_wf:     () => activeCount() >= 1,
  all_types:    () => activeCount() >= 4,
  no_bug_5:     (s) => s.stats.cleanSince != null && s.stats.playSeconds - s.stats.cleanSince >= CONFIG.zeroBugSec,
  first_bug:    (s) => s.stats.bugs >= 1,
  staff_5:      (s) => s.staff.length >= 5,
  first_hire:   (s) => s.staff.length >= 1,
  full_team:    () => ["yanis", "jadd", "noah"].every((k) => team()[k].on),
  firewall:     (s) => s.stats.attacksRepelled >= 10,
  fresh_air:    (s) => s.stats.windowsOpened >= 10,
  office_3:     (s) => s.office >= 3,
  hours_100:    (s) => s.lifetimeHours >= 100,
  rich:         (s) => s.stats.moneyEarned >= 10000,
  agency_2:     (s) => s.city >= 1,
  agency_3:     (s) => s.city >= 2,
};

export function rewardText(r) {
  if (r.money) return `+${r.money} EUR`;
  if (r.mult) return `+${Math.round(r.mult * 100)} % de gains`;
  return "";
}

let acc = 0;
function tick(dt) {
  acc += dt;
  if (acc < 1) return;
  acc = 0;
  for (const a of CONFIG.achievements) {
    if (state.achievements[a.id] || !COND[a.id](state)) continue;
    state.achievements[a.id] = true;
    if (a.reward.money) { state.money += a.reward.money; state.stats.moneyEarned += a.reward.money; }
    if (a.reward.mult) state.bonusMult += a.reward.mult;
    toast(`Succès : ${a.label} (${rewardText(a.reward)})`, 4200);
    sfx.unlock();
  }
}

export function initAchievements() { addSystem(tick); }
