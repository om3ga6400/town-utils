import { ITEM_STATS, ITEM_CATEGORIES, STATS, weapons } from "./config.js";
import { selectLeft, selectRight, compareCategory, output, searchInput, sortStat, sortOrder, classFilter, dpsTime, accuracyPercent, dpsDistance, dpsMultiplier, searchResults, dpsRow } from "./dom.js";
import { getWeaponClass, getComparisonClass, getInputValue, parseAmmo } from "./utils.js";
import { calcDPS } from "./calculator.js";

export const renderWeaponOptions = () => {
  const categoryWeapons = ITEM_CATEGORIES[compareCategory.value]?.weapons ?? [];
  const weaponOptionsHtml = categoryWeapons.map((weapon) => `<option value="${weapon}">${weapon}</option>`).join("");

  selectLeft.innerHTML = weaponOptionsHtml;
  selectRight.innerHTML = weaponOptionsHtml;
  selectRight.selectedIndex = Math.min(1, categoryWeapons.length - 1);
};

export const renderComparison = () => {
  const leftName = selectLeft.value;
  const rightName = selectRight.value;
  const leftStats = ITEM_STATS[leftName] || {};
  const rightStats = ITEM_STATS[rightName] || {};

  const time = getInputValue(dpsTime, 10);
  const accuracyPct = getInputValue(accuracyPercent, 100);
  const distance = getInputValue(dpsDistance, 0);
  const multiplierType = dpsMultiplier.value;

  const bothAreGuns = ITEM_CATEGORIES["Guns"]?.weapons.includes(leftName) && ITEM_CATEGORIES["Guns"]?.weapons.includes(rightName);
  const getStatValue = (name, stats, key, computed) => (computed ? calcDPS(name, time, multiplierType, accuracyPct, distance) : (stats[key] ?? "—"));

  const classRow = `<div class="stat-row"><div>${getWeaponClass(leftName)}</div><div>Class</div><div>${getWeaponClass(rightName)}</div></div>`;

  const statsRows = STATS.filter(({ key, computed }) => !(key === "dps" && !bothAreGuns) && (getStatValue(leftName, leftStats, key, computed) !== "—" || getStatValue(rightName, rightStats, key, computed) !== "—"))
    .map(({ key, label, higher, computed }) => {
      const leftValue = getStatValue(leftName, leftStats, key, computed);
      const rightValue = getStatValue(rightName, rightStats, key, computed);
      const parseNum = (val) => {
        if (val === "—") return NaN;
        if (typeof val === "string" && val.includes("%")) return Number(val.replace("%", ""));
        if (key === "ammo") return parseAmmo(val);
        return Number(val);
      };
      const leftNum = parseNum(leftValue);
      const rightNum = parseNum(rightValue);
      return `<div class="stat-row"><div class="${getComparisonClass(leftNum, rightNum, higher)}">${leftValue}</div><div>${label}</div><div class="${getComparisonClass(rightNum, leftNum, higher)}">${rightValue}</div></div>`;
    })
    .join("");

  output.innerHTML = classRow + statsRows;
};

export const renderSearch = () => {
  const query = searchInput.value.toLowerCase().trim();
  const statKey = sortStat.value;
  const { higher } = STATS.find((statConfig) => statConfig.key === statKey) || {};
  const isDescending = sortOrder.value === "desc";
  const classFilterValue = classFilter.value;

  const classWeapons = classFilterValue === "all" ? weapons : (ITEM_CATEGORIES[classFilterValue]?.weapons ?? []);

  const time = getInputValue(dpsTime, 10);
  const pelletPct = getInputValue(accuracyPercent, 100);
  const distance = getInputValue(dpsDistance, 0);
  const multiplierType = dpsMultiplier.value;

  const filtered = classWeapons
    .filter((weapon) => weapon.toLowerCase().includes(query))
    .map((weapon) => ({
      name: weapon,
      value: statKey === "dps" ? calcDPS(weapon, time, multiplierType, pelletPct, distance) : (ITEM_STATS[weapon]?.[statKey] ?? null),
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
