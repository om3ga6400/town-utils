import { WEAPON_STATS, WEAPON_CATEGORIES } from "../data/weapon-data.js";

// --- Configuration ---
const STATS = [
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

const weapons = Object.keys(WEAPON_STATS).sort();

// --- DOM Elements ---
const $ = (id) => document.getElementById(id);
const selectLeft = $("weapon-left");
const selectRight = $("weapon-right");
const output = $("stats-output");
const searchInput = $("search-input");
const classFilter = $("class-filter");
const sortStat = $("sort-stat");
const sortOrder = $("sort-order");
const searchResults = $("search-results");
const dpsRow = document.querySelector(".dps-row");
const dpsTime = $("dps-time");
const dpsMultiplier = $("dps-multiplier");
const pelletHitPercent = $("pellet-hit-percent");
const dpsDistance = $("dps-distance");

// --- Utility Functions ---
const parseAmmo = (value) => {
  if (value === "inf") return Infinity;
  if (typeof value === "string" && value.includes("+")) {
    return value.split("+").reduce((sum, num) => sum + Number(num), 0);
  }
  return Number(value) || 0;
};

const getWeaponClass = (weaponName) => {
  return Object.keys(WEAPON_CATEGORIES).find((className) => WEAPON_CATEGORIES[className].weapons.includes(weaponName)) || "Unknown";
};

const getComparisonClass = (leftVal, rightVal, higherIsBetter) => {
  if (leftVal === rightVal) return "same";
  if (isNaN(leftVal) || isNaN(rightVal)) return "";
  return (higherIsBetter ? leftVal > rightVal : leftVal < rightVal) ? "better" : "worse";
};

const getInputValue = (element, defaultValue) => {
  const val = parseFloat(element.value);
  return isNaN(val) ? defaultValue : val;
};

// --- Core Logic ---
const calcDamageAtDistance = (stats, distance = 0) => {
  const maxDamage = Number(stats.damage_max) || 0;
  const minDamage = Number(stats.damage_min ?? stats.damage_max) || 0;
  const dist = Math.max(0, Number(distance) || 0);
  const maxRange = Number(stats.max_bullet_range ?? stats.damage_falloff_start) || 0;

  if (maxRange <= 0) return maxDamage;
  if (dist >= maxRange) return minDamage;

  const t = dist / maxRange;
  return maxDamage + (minDamage - maxDamage) * t;
};

const calcDPS = (weaponName, time = 10, multType = "none", pelletHitPct = 100, distance = 0) => {
  const stats = WEAPON_STATS[weaponName];
  if (!stats) return null;

  const multiplier = multType === "none" ? 1 : (stats[`${multType}_multiplier`] ?? 1);
  const pelletMult = stats.pellet_count ? (stats.pellet_count * pelletHitPct) / 100 : 1;
  const baseDamage = calcDamageAtDistance(stats, distance);
  const totalDamagePerShot = baseDamage * multiplier * pelletMult;

  const ammo = parseAmmo(stats.ammo);
  const rps = (stats.firerate || 0) / 60; // Rounds per second

  // Infinite ammo calculation
  if (ammo === Infinity) {
    return Math.round(((1 + time * rps) * totalDamagePerShot) / time);
  }

  // Reload calculation
  const reloadTime = stats.reload_per_bullet ? ammo * stats.reload_speed_empty : stats.reload_speed_empty;
  const cycleTime = (ammo - 1) / rps + reloadTime;
  const fullCycles = Math.floor(time / cycleTime);
  const remainingTime = time - fullCycles * cycleTime;
  const remainingShots = Math.min(ammo, 1 + Math.floor(remainingTime * rps));

  return Math.round(((fullCycles * ammo + remainingShots) * totalDamagePerShot) / time);
};

// --- Rendering Functions ---
const renderComparison = () => {
  const leftName = selectLeft.value;
  const rightName = selectRight.value;
  const leftStats = WEAPON_STATS[leftName];
  const rightStats = WEAPON_STATS[rightName];

  const time = getInputValue(dpsTime, 10);
  const pelletPct = getInputValue(pelletHitPercent, 100);
  const distance = getInputValue(dpsDistance, 0);
  const multiplierType = dpsMultiplier.value;

  const classRow = `
    <div class="stat-row">
      <div>${getWeaponClass(leftName)}</div>
      <div>Class</div>
      <div>${getWeaponClass(rightName)}</div>
    </div>
  `;

  const statsRows = STATS.map(({ key, label, higher, computed }) => {
    const leftValue = computed ? calcDPS(leftName, time, multiplierType, pelletPct, distance) : (leftStats?.[key] ?? "—");

    const rightValue = computed ? calcDPS(rightName, time, multiplierType, pelletPct, distance) : (rightStats?.[key] ?? "—");

    const leftNum = key === "ammo" ? parseAmmo(leftValue) : Number(leftValue);
    const rightNum = key === "ammo" ? parseAmmo(rightValue) : Number(rightValue);

    const leftClass = getComparisonClass(leftNum, rightNum, higher);
    const rightClass = getComparisonClass(rightNum, leftNum, higher);

    return `
      <div class="stat-row">
        <div class="${leftClass}">${leftValue}</div>
        <div>${label}</div>
        <div class="${rightClass}">${rightValue}</div>
      </div>
    `;
  }).join("");

  output.innerHTML = classRow + statsRows;
};

const renderSearch = () => {
  const query = searchInput.value.toLowerCase().trim();
  const statKey = sortStat.value;
  const statConfig = STATS.find((s) => s.key === statKey);
  const isDescending = sortOrder.value === "desc";
  const classFilterValue = classFilter.value;

  const classWeapons = classFilterValue === "all" ? weapons : (WEAPON_CATEGORIES[classFilterValue]?.weapons ?? []);

  const time = getInputValue(dpsTime, 10);
  const pelletPct = getInputValue(pelletHitPercent, 100);
  const distance = getInputValue(dpsDistance, 0);

  const filtered = classWeapons
    .filter((weapon) => weapon.toLowerCase().includes(query))
    .map((weapon) => ({
      name: weapon,
      value: statKey === "dps" ? calcDPS(weapon, time, dpsMultiplier.value, pelletPct, distance) : (WEAPON_STATS[weapon]?.[statKey] ?? null),
    }))
    .filter((item) => item.value !== null)
    .sort((a, b) => {
      const diff = parseAmmo(a.value) - parseAmmo(b.value);
      return (isDescending === !!statConfig?.higher ? -1 : 1) * diff;
    });

  searchResults.innerHTML = filtered
    .map(
      (item, index) => `
    <div class="result-row" data-weapon="${item.name}">
      <span>${item.name}</span>
      <span class="stat-value">${item.value}</span>
      <span class="placement">#${index + 1}</span>
    </div>
  `,
    )
    .join("");
};

const updateUIState = () => {
  const showDpsOptions = sortStat.value === "dps";
  dpsRow.style.display = showDpsOptions ? "flex" : "none";
  dpsMultiplier.style.display = showDpsOptions ? "block" : "none";
};

// --- Initialization & Event Listeners ---
const init = () => {
  // Populate dropdowns
  const weaponOptionsHtml = weapons.map((w) => `<option value="${w}">${w}</option>`).join("");
  selectLeft.innerHTML = weaponOptionsHtml;
  selectRight.innerHTML = weaponOptionsHtml;
  selectRight.selectedIndex = Math.min(1, weapons.length - 1);

  const classOptionsHtml = Object.keys(WEAPON_CATEGORIES)
    .map((cls) => `<option value="${cls}">${cls}</option>`)
    .join("");
  classFilter.innerHTML = `<option value="all">All Classes</option>${classOptionsHtml}`;

  sortStat.innerHTML = STATS.map((s) => `<option value="${s.key}">${s.label}</option>`).join("");

  // Initialize UI state
  updateUIState();
  renderComparison();
  renderSearch();

  // Attach event listeners
  const reRenderAll = () => {
    renderComparison();
    renderSearch();
  };

  selectLeft.addEventListener("change", renderComparison);
  selectRight.addEventListener("change", renderComparison);

  sortStat.addEventListener("change", () => {
    updateUIState();
    renderSearch();
  });

  searchInput.addEventListener("input", renderSearch);
  classFilter.addEventListener("change", renderSearch);
  sortOrder.addEventListener("change", renderSearch);

  [dpsTime, dpsMultiplier, pelletHitPercent, dpsDistance].forEach((el) => {
    el.addEventListener("input", reRenderAll);
    el.addEventListener("change", reRenderAll);
  });

  searchResults.addEventListener("click", (e) => {
    const row = e.target.closest(".result-row");
    if (row) {
      selectLeft.value = row.dataset.weapon;
      renderComparison();
    }
  });
};

init();
