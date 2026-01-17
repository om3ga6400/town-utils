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
  { key: "reload_speed_partial", label: "Reload (partial)" },
  { key: "reload_speed_empty", label: "Reload (empty)" },
  { key: "equip_speed", label: "Equip speed" },
  { key: "aim_speed", label: "Aim speed" },
  { key: "weight", label: "Weight" },
  { key: "ammo", label: "Ammo", higher: true },
];

const weapons = Object.keys(WEAPON_STATS).sort();
const $ = (id) => document.getElementById(id);

// DOM
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

const parseAmmo = (v) => {
  if (v === "inf") return Infinity;
  if (typeof v === "string" && v.includes("+"))
    return v.split("+").reduce((a, b) => +a + +b, 0);
  return +v;
};

/*
 * DPS Formula:
 * rps = firerate / 60
 * pelletMult = pellet_count ? (pellet_count * pelletHitPercent / 100) : 1
 * damage = damage_max * [head|torso|limb]_multiplier * pelletMult
 * magTime = ammo / rps
 * cycleTime = magTime + reload_speed_empty
 * fullCycles = floor(time / cycleTime)
 * remaining = time - fullCycles * cycleTime
 * remainingShots = min(ammo, floor(remaining * rps))
 * totalShots = fullCycles * ammo + remainingShots
 * totalDamage = totalShots * damage
 * DPS = totalDamage / time
 */
const calcDPS = (w, time = 10, multType = "none", pelletHitPct = 100) => {
  const s = WEAPON_STATS[w];
  if (!s) return null;
  const mult = multType === "none" ? 1 : (s[multType + "_multiplier"] ?? 1);
  const pelletMult = s.pellet_count ? (s.pellet_count * pelletHitPct / 100) : 1;
  const damage = s.damage_max * mult * pelletMult;
  const ammo = parseAmmo(s.ammo);
  const rps = s.firerate / 60;
  
  // Infinite ammo = no reloads, just continuous fire
  if (ammo === Infinity) return Math.round(rps * damage);
  
  const cycleTime = ammo / rps + s.reload_speed_empty;
  const fullCycles = Math.floor(time / cycleTime);
  const remaining = time - fullCycles * cycleTime;
  const remainingShots = Math.min(ammo, Math.floor(remaining * rps));
  return Math.round(((fullCycles * ammo + remainingShots) * damage) / time);
};

const getClass = (a, b, higher) => {
  if (a === b) return "same";
  if (isNaN(a) || isNaN(b)) return "";
  return (higher ? a > b : a < b) ? "better" : "worse";
};

const getWeaponClass = (weaponName) => {
  for (const [className, data] of Object.entries(WEAPON_CATEGORIES)) {
    if (data.weapons.includes(weaponName)) return className;
  }
  return "Unknown";
};

const render = () => {
  const [ln, rn] = [selectLeft.value, selectRight.value];
  const [left, right] = [WEAPON_STATS[ln], WEAPON_STATS[rn]];
  const time = parseFloat(dpsTime.value) || 10;
  const mult = dpsMultiplier.value;
  const pelletPct = parseFloat(pelletHitPercent.value) || 100;

  const classRow = `<div class="stat-row">
    <div>${getWeaponClass(ln)}</div>
    <div>Class</div>
    <div>${getWeaponClass(rn)}</div>
  </div>`;

  const statsRows = STATS.map(({ key, label, higher, computed }) => {
    const lv = computed ? calcDPS(ln, time, mult, pelletPct) : (left?.[key] ?? "—");
    const rv = computed ? calcDPS(rn, time, mult, pelletPct) : (right?.[key] ?? "—");
    const lvNum = key === "ammo" ? parseAmmo(lv) : +lv;
    const rvNum = key === "ammo" ? parseAmmo(rv) : +rv;
    return `<div class="stat-row">
      <div class="${getClass(lvNum, rvNum, higher)}">${lv}</div>
      <div>${label}</div>
      <div class="${getClass(rvNum, lvNum, higher)}">${rv}</div>
    </div>`;
  }).join("");

  const lPellets = left?.pellet_count ?? 1;
  const rPellets = right?.pellet_count ?? 1;
  const pelletRow = `<div class="stat-row">
    <div class="${getClass(lPellets, rPellets, true)}">${lPellets}</div>
    <div>Pellet count</div>
    <div class="${getClass(rPellets, lPellets, true)}">${rPellets}</div>
  </div>`;

  output.innerHTML = classRow + statsRows + pelletRow;
};

const renderSearch = () => {
  const query = searchInput.value.toLowerCase();
  const statKey = sortStat.value;
  const stat = STATS.find((s) => s.key === statKey);
  const desc = sortOrder.value === "desc";
  const classWeapons =
    classFilter.value === "all"
      ? weapons
      : (WEAPON_CATEGORIES[classFilter.value]?.weapons ?? []);

  const filtered = classWeapons
    .filter((w) => w.toLowerCase().includes(query))
    .map((w) => ({
      name: w,
      value:
        statKey === "dps"
          ? calcDPS(w, parseFloat(dpsTime.value) || 10, dpsMultiplier.value, parseFloat(pelletHitPercent.value) || 100)
          : (WEAPON_STATS[w]?.[statKey] ?? null),
    }))
    .filter((w) => w.value !== null)
    .sort(
      (a, b) =>
        (desc === stat.higher ? -1 : 1) *
        (parseAmmo(a.value) - parseAmmo(b.value)),
    );

  searchResults.innerHTML = filtered
    .map(
      (w, i) => `<div class="result-row" data-weapon="${w.name}">
    <span>${w.name}</span>
    <span class="stat-value">${w.value}</span>
    <span class="placement">#${i + 1}</span>
  </div>`,
    )
    .join("");
};

// Init dropdowns
const opts = weapons.map((w) => `<option value="${w}">${w}</option>`).join("");
selectLeft.innerHTML = selectRight.innerHTML = opts;
selectRight.selectedIndex = Math.min(1, weapons.length - 1);

classFilter.innerHTML =
  `<option value="all">All Classes</option>` +
  Object.keys(WEAPON_CATEGORIES)
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");

sortStat.innerHTML = STATS.map(
  (s) => `<option value="${s.key}">${s.label}</option>`,
).join("");

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
dpsTime.oninput = dpsMultiplier.onchange = pelletHitPercent.oninput = () => { render(); renderSearch(); };
searchResults.onclick = (e) => {
  const row = e.target.closest(".result-row");
  if (row) {
    selectLeft.value = row.dataset.weapon;
    render();
  }
};

render();
renderSearch();
