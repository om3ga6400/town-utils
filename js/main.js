const ITEM_STATS = {};
const ITEM_CATEGORIES = {};

const STAT_DEFINITIONS = [
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
  { key: "accuracy", label: "Accuracy", higher: true },
  { key: "range_finder", label: "Range Finder", higher: true },
  { key: "suppression_mult", label: "Suppression", higher: true },
  { key: "hide_flash", label: "Hide Flash", higher: true },
  { key: "bullet_speed_min", label: "Bullet Speed", higher: true },
  { key: "muzzle_flip", label: "Muzzle Flip", higher: false },
];

const dom = {
  leftWeapon: document.getElementById("weapon-left"),
  rightWeapon: document.getElementById("weapon-right"),
  categorySelect: document.getElementById("compare-category"),
  comparisonOutput: document.getElementById("stats-output"),
  searchInput: document.getElementById("search-input"),
  classFilter: document.getElementById("class-filter"),
  statSelect: document.getElementById("sort-stat"),
  orderSelect: document.getElementById("sort-order"),
  searchResults: document.getElementById("search-results"),
  dpsControls: document.querySelector(".dps-row"),
  dpsTime: document.getElementById("dps-time"),
  multiplierSelect: document.getElementById("dps-multiplier"),
  accuracyInput: document.getElementById("accuracy-percent"),
  distanceInput: document.getElementById("dps-distance"),
};

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const parseAmmo = (value) => (value === "inf" ? Infinity : typeof value === "string" && value.includes("+") ? value.split("+").reduce((sum, part) => sum + Number(part), 0) : num(value, 0));

const normalize = (key, value) => (value === "—" ? NaN : typeof value === "string" && value.includes("%") ? Number(value.replace("%", "")) : key === "ammo" ? parseAmmo(value) : Number(value));

const cls = (left, right, higher) => (left === right ? "same" : !Number.isFinite(left) || !Number.isFinite(right) ? "" : higher ? (left > right ? "better" : "worse") : left < right ? "better" : "worse");

const weaponCategory = (weapon) => {
  for (const [category, data] of Object.entries(ITEM_CATEGORIES)) {
    if (data.weapons.includes(weapon)) return category;
  }
  return "Unknown";
};

const weapons = (category) => (category === "all" ? (ITEM_CATEGORIES.Guns?.weapons ?? []) : (ITEM_CATEGORIES[category]?.weapons ?? []));

const settings = () => ({
  duration: num(dom.dpsTime.value, 10),
  accuracy: num(dom.accuracyInput.value, 100),
  distance: num(dom.distanceInput.value, 0),
  multiplier: dom.multiplierSelect.value,
});

const damageAtDistance = (stats, distance) => {
  const maxDamage = num(stats.damage_max, 0);
  const minDamage = num(stats.damage_min ?? stats.damage_max, maxDamage);
  const range = num(stats.max_bullet_range ?? stats.damage_falloff_start, 0);
  const dist = Math.max(0, distance);
  return range <= 0 ? maxDamage : dist >= range ? (dist === range ? minDamage : 0) : maxDamage + ((minDamage - maxDamage) * dist) / range;
};

const dpsValue = (weapon, settings) => {
  const stats = ITEM_STATS[weapon];
  if (!stats) return 0;
  const multiplier = settings.multiplier === "none" ? 1 : num(stats[`${settings.multiplier}_multiplier`], 1);
  const pelletCount = num(stats.pellet_count, 0);
  const damagePerShot = damageAtDistance(stats, settings.distance) * multiplier * (pelletCount ? (pelletCount * settings.accuracy) / 100 : 1);
  const ammoCount = parseAmmo(stats.ammo);
  const rps = num(stats.firerate, 0) / 60;
  if (rps <= 0) return 0;
  if (ammoCount === Infinity) {
    const shots = 1 + Math.floor(settings.duration * rps);
    return Math.round(shots * damagePerShot);
  }
  const reloadTime = num(stats.reload_speed_empty, 0) * (stats.reload_per_bullet ? ammoCount : 1);
  const cycleTime = Math.max(0, (ammoCount - 1) / rps) + reloadTime;
  const fullCycles = Math.floor(settings.duration / cycleTime);
  const remainingTime = settings.duration - fullCycles * cycleTime;
  const remainingShots = Math.min(ammoCount, 1 + Math.floor(remainingTime * rps));
  return Math.round((fullCycles * ammoCount + remainingShots) * damagePerShot);
};

const statValue = (weapon, stat, settings) => (stat.computed ? dpsValue(weapon, settings) : (ITEM_STATS[weapon]?.[stat.key] ?? "—"));

const renderWeaponOptions = () => {
  const list = weapons(dom.categorySelect.value);
  const html = list.map((weapon) => `<option value="${weapon}">${weapon}</option>`).join("");
  dom.leftWeapon.innerHTML = dom.rightWeapon.innerHTML = html;
  dom.rightWeapon.selectedIndex = Math.min(1, list.length - 1);
};

const renderComparison = () => {
  const left = dom.leftWeapon.value;
  const right = dom.rightWeapon.value;
  const set = settings();
  const showDps = weapons("Guns").includes(left) && weapons("Guns").includes(right);
  dom.comparisonOutput.innerHTML = [
    `<div class="stat-row"><div>${weaponCategory(left)}</div><div>Class</div><div>${weaponCategory(right)}</div></div>`,
    ...STAT_DEFINITIONS.filter((stat) => stat.key !== "dps" || showDps)
      .map((stat) => {
        const leftValue = statValue(left, stat, set);
        const rightValue = statValue(right, stat, set);
        if (leftValue === "—" && rightValue === "—") return "";
        const leftClass = cls(normalize(stat.key, leftValue), normalize(stat.key, rightValue), stat.higher);
        const rightClass = cls(normalize(stat.key, rightValue), normalize(stat.key, leftValue), stat.higher);
        return `<div class="stat-row"><div class="${leftClass}">${leftValue}</div><div>${stat.label}</div><div class="${rightClass}">${rightValue}</div></div>`;
      })
      .filter(Boolean),
  ].join("");
};

const renderSearch = () => {
  const query = dom.searchInput.value.trim().toLowerCase();
  const statKey = dom.statSelect.value;
  const order = dom.orderSelect.value === "desc" ? -1 : 1;
  const set = settings();
  const stat = STAT_DEFINITIONS.find((item) => item.key === statKey) || STAT_DEFINITIONS[0];
  dom.searchResults.innerHTML = weapons(dom.classFilter.value)
    .filter((weapon) => weapon.toLowerCase().includes(query))
    .map((weapon) => ({ name: weapon, value: statValue(weapon, stat, set) }))
    .sort((a, b) => {
      const aValue = normalize(statKey, a.value);
      const bValue = normalize(statKey, b.value);
      if (!Number.isFinite(aValue)) return Number.isFinite(bValue) ? 1 : 0;
      if (!Number.isFinite(bValue)) return -1;
      return order * (aValue - bValue);
    })
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

const toggleDpsControls = () => {
  const show = dom.statSelect.value === "dps";
  dom.dpsControls.style.display = show ? "flex" : "none";
  dom.multiplierSelect.style.display = show ? "block" : "none";
};

const refresh = () => {
  renderComparison();
  renderSearch();
};

const attachEventListeners = () => {
  dom.categorySelect.addEventListener("change", () => {
    renderWeaponOptions();
    refresh();
  });
  [dom.leftWeapon, dom.rightWeapon].forEach((el) => el.addEventListener("change", refresh));
  dom.statSelect.addEventListener("change", () => {
    toggleDpsControls();
    renderSearch();
  });
  [dom.searchInput, dom.classFilter, dom.orderSelect].forEach((el) => el.addEventListener("change", renderSearch));
  [dom.dpsTime, dom.multiplierSelect, dom.accuracyInput, dom.distanceInput].forEach((el) => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
  dom.searchResults.addEventListener("click", (event) => {
    const row = event.target.closest(".result-row");
    if (!row) return;
    dom.leftWeapon.value = row.dataset.weapon;
    renderComparison();
  });
};

const init = () => {
  dom.statSelect.innerHTML = STAT_DEFINITIONS.map((stat) => `<option value="${stat.key}">${stat.label}</option>`).join("");
  renderWeaponOptions();
  toggleDpsControls();
  refresh();
  attachEventListeners();
};

const GUN_CATEGORIES = ["LMGs", "Pistols", "Rifles", "Shotguns", "SMGs", "Snipers", "Specials"];
const ATTACHMENT_CATEGORIES = ["Barrels", "Grips", "Others", "Sights", "Stocks"];

const loadDataAndInit = async () => {
  const allGuns = [];
  for (const category of GUN_CATEGORIES) {
    const data = await fetch(`data/guns/${category.toLowerCase()}.json`).then((response) => response.json());
    Object.assign(ITEM_STATS, data);
    ITEM_CATEGORIES[category] = { weapons: Object.keys(data) };
    allGuns.push(...Object.keys(data));
  }
  ITEM_CATEGORIES.Guns = { weapons: allGuns };
  for (const category of ATTACHMENT_CATEGORIES) {
    const data = await fetch(`data/attachments/${category.toLowerCase()}.json`).then((response) => response.json());
    Object.assign(ITEM_STATS, data);
    ITEM_CATEGORIES[category] = { weapons: Object.keys(data) };
  }
  init();
};

loadDataAndInit();
