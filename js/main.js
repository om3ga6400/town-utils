import { WEAPON_STATS, WEAPON_CATEGORIES } from "../data/weapon-data.js";

const STATS = [
  { key: "dps", label: "DPS", higher: true, computed: true },
  { key: "damage_max", label: "Damage (max)", higher: true },
  { key: "damage_min", label: "Damage (min)", higher: true },
  { key: "firerate", label: "Fire rate (RPM)", higher: true },
  { key: "damage_falloff_start", label: "Falloff start", higher: true },
  { key: "max_bullet_range", label: "Max range", higher: true },
  { key: "hip_fire_accuracy", label: "Hip accuracy", higher: true },
  { key: "ads_accuracy", label: "ADS accuracy", higher: true },
  { key: "vertical_recoil", label: "Vertical recoil" },
  { key: "horizontal_recoil", label: "Horizontal recoil" },
  { key: "head_multiplier", label: "Head multiplier", higher: true },
  { key: "torso_multiplier", label: "Torso multiplier", higher: true },
  { key: "limb_multiplier", label: "Limb multiplier", higher: true },
  { key: "reload_speed_partial", label: "Reload (partial)" },
  { key: "reload_speed_empty", label: "Reload (empty)" },
  { key: "equip_speed", label: "Equip speed" },
  { key: "aim_speed", label: "Aim speed" },
  { key: "weight", label: "Weight" },
  { key: "ammo", label: "Ammo", higher: true },
  { key: "pellet_count", label: "Pellet count", higher: true },
  { key: "reload_per_bullet", label: "Reload per bullet" },
  { key: "game_pass", label: "Game Pass" },
];

const weapons = Object.keys(WEAPON_STATS).sort();
const getById = (id) => document.getElementById(id);

// DOM
const selectLeft = getById("weapon-left");
const selectRight = getById("weapon-right");
const output = getById("stats-output");
const searchInput = getById("search-input");
const classFilter = getById("class-filter");
const sortStat = getById("sort-stat");
const sortOrder = getById("sort-order");
const searchResults = getById("search-results");
const dpsRow = document.querySelector(".dps-row");
const dpsTime = getById("dps-time");
const dpsMultiplier = getById("dps-multiplier");
const pelletHitPercent = getById("pellet-hit-percent");

const parseAmmo = (value) => {
  if (value === "inf") return Infinity;
  if (typeof value === "string" && value.includes("+")) return value.split("+").reduce((sum, num) => +sum + +num, 0);
  return +value;
};

/*
 * DPS Formula:
 * rps = firerate / 60
 * pelletMult = pellet_count ? (pellet_count * pelletHitPercent / 100) : 1
 * damage = damage_max * [head|torso|limb]_multiplier * pelletMult
 * shotInterval = 1 / rps (time between shots)
 * magTime = (ammo - 1) / rps (first shot is instant, remaining shots follow fire rate)
 *
 * For standard reload:
 *   reloadTime = reload_speed_empty
 *
 * For per-bullet reload (reload_per_bullet = true):
 *   reloadTime = ammo * reload_speed_empty
 *
 * cycleTime = magTime + reloadTime
 * fullCycles = floor(time / cycleTime)
 * remaining = time - fullCycles * cycleTime
 * remainingShots = min(ammo, 1 + floor(remaining * rps))  // First shot instant
 * totalShots = fullCycles * ammo + remainingShots
 * totalDamage = totalShots * damage
 * DPS = totalDamage / time
 */
const calcDPS = (weaponName, time = 10, multType = "none", pelletHitPct = 100) => {
  const stats = WEAPON_STATS[weaponName];
  if (!stats) return null;
  const multiplier = multType === "none" ? 1 : (stats[multType + "_multiplier"] ?? 1);
  const pelletMult = stats.pellet_count ? (stats.pellet_count * pelletHitPct) / 100 : 1;
  const damage = stats.damage_max * multiplier * pelletMult;
  const ammo = parseAmmo(stats.ammo);
  const rps = stats.firerate / 60;

  // Infinite ammo = no reloads, just continuous fire (first shot instant + continuous)
  if (ammo === Infinity) return Math.round(((1 + time * rps) * damage) / time);

  // Per-bullet reload: reload time = ammo * reload_speed_empty
  const reloadTime = stats.reload_per_bullet ? ammo * stats.reload_speed_empty : stats.reload_speed_empty;
  // First shot is instant, so mag time is (ammo - 1) / rps
  const cycleTime = (ammo - 1) / rps + reloadTime;
  const fullCycles = Math.floor(time / cycleTime);
  const remaining = time - fullCycles * cycleTime;
  // First shot is instant, then subsequent shots follow fire rate
  const remainingShots = Math.min(ammo, 1 + Math.floor(remaining * rps));
  return Math.round(((fullCycles * ammo + remainingShots) * damage) / time);
};

const getClass = (leftVal, rightVal, higher) => {
  if (leftVal === rightVal) return "same";
  if (isNaN(leftVal) || isNaN(rightVal)) return "";
  return (higher ? leftVal > rightVal : leftVal < rightVal) ? "better" : "worse";
};

const getWeaponClass = (weaponName) => {
  for (const [className, data] of Object.entries(WEAPON_CATEGORIES)) {
    if (data.weapons.includes(weaponName)) return className;
  }
  return "Unknown";
};

const render = () => {
  const [leftName, rightName] = [selectLeft.value, selectRight.value];
  const [leftStats, rightStats] = [WEAPON_STATS[leftName], WEAPON_STATS[rightName]];
  const time = parseFloat(dpsTime.value) || 10;
  const multiplierType = dpsMultiplier.value;
  const pelletPct = isNaN(parseFloat(pelletHitPercent.value)) ? 100 : parseFloat(pelletHitPercent.value);

  const classRow = `<div class="stat-row">
    <div>${getWeaponClass(leftName)}</div>
    <div>Class</div>
    <div>${getWeaponClass(rightName)}</div>
  </div>`;

  const statsRows = STATS.map(({ key, label, higher, computed }) => {
    const leftValue = computed ? calcDPS(leftName, time, multiplierType, pelletPct) : (leftStats?.[key] ?? "—");
    const rightValue = computed ? calcDPS(rightName, time, multiplierType, pelletPct) : (rightStats?.[key] ?? "—");
    const leftNum = key === "ammo" ? parseAmmo(leftValue) : +leftValue;
    const rightNum = key === "ammo" ? parseAmmo(rightValue) : +rightValue;
    return `<div class="stat-row">
      <div class="${getClass(leftNum, rightNum, higher)}">${leftValue}</div>
      <div>${label}</div>
      <div class="${getClass(rightNum, leftNum, higher)}">${rightValue}</div>
    </div>`;
  }).join("");

  output.innerHTML = classRow + statsRows;
};

const renderSearch = () => {
  const query = searchInput.value.toLowerCase();
  const statKey = sortStat.value;
  const stat = STATS.find((statItem) => statItem.key === statKey);
  const isDescending = sortOrder.value === "desc";
  const classWeapons = classFilter.value === "all" ? weapons : (WEAPON_CATEGORIES[classFilter.value]?.weapons ?? []);

  const filtered = classWeapons
    .filter((weapon) => weapon.toLowerCase().includes(query))
    .map((weapon) => ({
      name: weapon,
      value: statKey === "dps" ? calcDPS(weapon, parseFloat(dpsTime.value) || 10, dpsMultiplier.value, isNaN(parseFloat(pelletHitPercent.value)) ? 100 : parseFloat(pelletHitPercent.value)) : (WEAPON_STATS[weapon]?.[statKey] ?? null),
    }))
    .filter((weaponData) => weaponData.value !== null)
    .sort((itemA, itemB) => (isDescending === stat.higher ? -1 : 1) * (parseAmmo(itemA.value) - parseAmmo(itemB.value)));

  searchResults.innerHTML = filtered
    .map(
      (weapon, index) => `<div class="result-row" data-weapon="${weapon.name}">
    <span>${weapon.name}</span>
    <span class="stat-value">${weapon.value}</span>
    <span class="placement">#${index + 1}</span>
  </div>`,
    )
    .join("");
};

// Init dropdowns
const weaponOptions = weapons.map((weapon) => `<option value="${weapon}">${weapon}</option>`).join("");
selectLeft.innerHTML = selectRight.innerHTML = weaponOptions;
selectRight.selectedIndex = Math.min(1, weapons.length - 1);

classFilter.innerHTML =
  `<option value="all">All Classes</option>` +
  Object.keys(WEAPON_CATEGORIES)
    .map((className) => `<option value="${className}">${className}</option>`)
    .join("");

sortStat.innerHTML = STATS.map((stat) => `<option value="${stat.key}">${stat.label}</option>`).join("");

dpsRow.style.display = "flex";
dpsMultiplier.style.display = "block";

// Events
selectLeft.onchange = selectRight.onchange = render;
sortStat.onchange = () => {
  const show = sortStat.value === "dps";
  dpsRow.style.display = show ? "flex" : "none";
  dpsMultiplier.style.display = show ? "block" : "none";
  renderSearch();
};
searchInput.oninput = classFilter.onchange = sortOrder.onchange = renderSearch;
dpsTime.oninput =
  dpsMultiplier.onchange =
  pelletHitPercent.oninput =
    () => {
      render();
      renderSearch();
    };
searchResults.onclick = (event) => {
  const row = event.target.closest(".result-row");
  if (row) {
    selectLeft.value = row.dataset.weapon;
    render();
  }
};

render();
renderSearch();
