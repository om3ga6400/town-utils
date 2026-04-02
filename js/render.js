import { WEAPON_STATS, WEAPON_CATEGORIES, STATS, weapons } from "./config.js";
import { selectLeft, selectRight, output, searchInput, sortStat, sortOrder, classFilter, dpsTime, pelletHitPercent, dpsDistance, dpsMultiplier, searchResults, dpsRow } from "./dom.js";
import { getWeaponClass, getComparisonClass, getInputValue, parseAmmo } from "./utils.js";
import { calcDPS } from "./calculator.js";

export const renderComparison = () => {
  const leftName = selectLeft.value;
  const rightName = selectRight.value;
  const leftStats = WEAPON_STATS[leftName] || {};
  const rightStats = WEAPON_STATS[rightName] || {};

  const time = getInputValue(dpsTime, 10);
  const pelletPct = getInputValue(pelletHitPercent, 100);
  const distance = getInputValue(dpsDistance, 0);
  const multiplierType = dpsMultiplier.value;

  const getStatValue = (name, stats, key, computed) => (computed ? calcDPS(name, time, multiplierType, pelletPct, distance) : (stats[key] ?? "—"));

  const classRow = `
    <div class="stat-row">
      <div>${getWeaponClass(leftName)}</div>
      <div>Class</div>
      <div>${getWeaponClass(rightName)}</div>
    </div>
  `;

  const statsRows = STATS.map(({ key, label, higher, computed }) => {
    const leftValue = getStatValue(leftName, leftStats, key, computed);
    const rightValue = getStatValue(rightName, rightStats, key, computed);

    const leftNum = key === "ammo" ? parseAmmo(leftValue) : Number(leftValue);
    const rightNum = key === "ammo" ? parseAmmo(rightValue) : Number(rightValue);

    return `
      <div class="stat-row">
        <div class="${getComparisonClass(leftNum, rightNum, higher)}">${leftValue}</div>
        <div>${label}</div>
        <div class="${getComparisonClass(rightNum, leftNum, higher)}">${rightValue}</div>
      </div>
    `;
  }).join("");

  output.innerHTML = classRow + statsRows;
};

export const renderSearch = () => {
  const query = searchInput.value.toLowerCase().trim();
  const statKey = sortStat.value;
  const { higher } = STATS.find((statConfig) => statConfig.key === statKey) || {};
  const isDescending = sortOrder.value === "desc";
  const classFilterValue = classFilter.value;

  const classWeapons = classFilterValue === "all" ? weapons : (WEAPON_CATEGORIES[classFilterValue]?.weapons ?? []);

  const time = getInputValue(dpsTime, 10);
  const pelletPct = getInputValue(pelletHitPercent, 100);
  const distance = getInputValue(dpsDistance, 0);
  const multiplierType = dpsMultiplier.value;

  const filtered = classWeapons
    .filter((weapon) => weapon.toLowerCase().includes(query))
    .map((weapon) => ({
      name: weapon,
      value: statKey === "dps" ? calcDPS(weapon, time, multiplierType, pelletPct, distance) : (WEAPON_STATS[weapon]?.[statKey] ?? null),
    }))
    .sort((a, b) => {
      const diff = parseAmmo(a.value) - parseAmmo(b.value);
      return (isDescending === !!higher ? -1 : 1) * diff;
    });

  searchResults.innerHTML = filtered
    .map(
      ({ name, value }, index) => `
    <div class="result-row" data-weapon="${name}">
      <span>${name}</span>
      <span class="stat-value">${value}</span>
      <span class="placement">#${index + 1}</span>
    </div>
  `,
    )
    .join("");
};

export const updateUIState = () => {
  const showDpsOptions = sortStat.value === "dps";
  dpsRow.style.display = showDpsOptions ? "flex" : "none";
  dpsMultiplier.style.display = showDpsOptions ? "block" : "none";
};
