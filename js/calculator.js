import { WEAPON_STATS } from "./config.js";
import { parseAmmo } from "./utils.js";

export const calcDamageAtDistance = (stats, distance = 0) => {
  const maxDamage = Number(stats.damage_max) || 0;
  const minDamage = Number(stats.damage_min ?? stats.damage_max) || 0;
  const dist = Math.max(0, Number(distance) || 0);
  const maxRange = Number(stats.max_bullet_range ?? stats.damage_falloff_start) || 0;

  if (maxRange <= 0) return maxDamage;
  if (dist > maxRange) return 0;
  if (dist === maxRange) return minDamage;

  const timeRatio = dist / maxRange;
  return maxDamage + (minDamage - maxDamage) * timeRatio;
};

export const calcDPS = (weaponName, time = 10, multType = "none", pelletHitPct = 100, distance = 0) => {
  const stats = WEAPON_STATS[weaponName];

  const multiplier = multType === "none" ? 1 : (stats[`${multType}_multiplier`] ?? 1);
  const pelletMult = stats.pellet_count ? (stats.pellet_count * pelletHitPct) / 100 : 1;
  const baseDamage = calcDamageAtDistance(stats, distance);
  const totalDamagePerShot = baseDamage * multiplier * pelletMult;

  const ammo = parseAmmo(stats.ammo);
  const rps = (stats.firerate || 0) / 60;

  if (ammo === Infinity) {
    return Math.round(((1 + time * rps) * totalDamagePerShot) / time);
  }

  const reloadTime = stats.reload_per_bullet ? ammo * stats.reload_speed_empty : stats.reload_speed_empty;
  const cycleTime = (ammo - 1) / rps + reloadTime;
  const fullCycles = Math.floor(time / cycleTime);
  const remainingTime = time - fullCycles * cycleTime;
  const remainingShots = Math.min(ammo, 1 + Math.floor(remainingTime * rps));

  return Math.round(((fullCycles * ammo + remainingShots) * totalDamagePerShot) / time);
};
