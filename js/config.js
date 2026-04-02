export let WEAPON_STATS = {};
export let WEAPON_CATEGORIES = {};
export let weapons = [];

export const STATS = [
  { key: "dps", label: "DPS", higher: true, computed: true },
  { key: "damage_max", label: "Damage (max)", higher: true },
  { key: "damage_min", label: "Damage (min)", higher: true },
  { key: "firerate", label: "Fire rate (RPM)", higher: true },
  { key: "damage_falloff_start", label: "Falloff start", higher: true },
  { key: "max_bullet_range", label: "Max range", higher: true },
  { key: "hip_fire_accuracy", label: "Hip accuracy", higher: true },
  { key: "ads_accuracy", label: "ADS accuracy", higher: true },
  { key: "vertical_recoil", label: "Vertical recoil", higher: false },
  { key: "horizontal_recoil", label: "Horizontal recoil", higher: false },
  { key: "head_multiplier", label: "Head multiplier", higher: true },
  { key: "torso_multiplier", label: "Torso multiplier", higher: true },
  { key: "limb_multiplier", label: "Limb multiplier", higher: true },
  { key: "reload_speed_partial", label: "Reload (partial)", higher: false },
  { key: "reload_speed_empty", label: "Reload (empty)", higher: false },
  { key: "equip_speed", label: "Equip speed", higher: false },
  { key: "aim_speed", label: "Aim speed", higher: false },
  { key: "weight", label: "Weight", higher: false },
  { key: "ammo", label: "Ammo", higher: true },
  { key: "pellet_count", label: "Pellet count", higher: true },
  { key: "reload_per_bullet", label: "Reload per bullet", higher: false },
  { key: "game_pass", label: "Game Pass" },
];

export const setWeapons = (weaponList) => {
  weapons = weaponList;
};
