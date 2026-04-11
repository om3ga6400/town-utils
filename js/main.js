import { ITEM_STATS, ITEM_CATEGORIES, weapons, STATS, setWeapons } from "./config.js";
import { selectLeft, selectRight, compareCategory, classFilter, sortStat, searchInput, sortOrder, dpsTime, dpsMultiplier, accuracyPercent, dpsDistance, searchResults } from "./dom.js";
import { renderComparison, renderSearch, renderWeaponOptions, updateUIState } from "./render.js";

const init = (gunCategoryNames) => {
  compareCategory.innerHTML = Object.keys(ITEM_CATEGORIES)
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
  compareCategory.value = "Guns";
  renderWeaponOptions();

  classFilter.innerHTML = ['<option value="all">All Classes</option>', ...gunCategoryNames.map((weaponClass) => `<option value="${weaponClass}">${weaponClass}</option>`)].join("");

  sortStat.innerHTML = STATS.map((stat) => `<option value="${stat.key}">${stat.label}</option>`).join("");

  updateUIState();
  renderComparison();
  renderSearch();

  const reRenderAll = () => {
    renderComparison();
    renderSearch();
  };

  compareCategory.addEventListener("change", () => {
    renderWeaponOptions();
    renderComparison();
  });
  [selectLeft, selectRight].forEach((element) => element.addEventListener("change", renderComparison));
  sortStat.addEventListener("change", () => {
    updateUIState();
    renderSearch();
  });
  searchInput.addEventListener("input", renderSearch);
  [classFilter, sortOrder].forEach((element) => element.addEventListener("change", renderSearch));

  [dpsTime, dpsMultiplier, accuracyPercent, dpsDistance].forEach((element) => {
    element.addEventListener("input", reRenderAll);
    element.addEventListener("change", reRenderAll);
  });

  searchResults.addEventListener("click", (event) => {
    const row = event.target.closest(".result-row");
    if (row) {
      selectLeft.value = row.dataset.weapon;
      renderComparison();
    }
  });
};

const loadDataAndInit = async () => {
  const allGuns = [];
  const gunDataFiles = ["lmgs", "pistols", "rifles", "shotguns", "smgs", "snipers", "specials"];

  await Promise.all(
    gunDataFiles.map(async (category) => {
      const data = await fetch(`data/guns/${category}.json`).then((r) => r.json());
      Object.assign(ITEM_STATS, data);
      allGuns.push(...Object.keys(data));
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      ITEM_CATEGORIES[categoryName] = { weapons: Object.keys(data) };
    }),
  );
  ITEM_CATEGORIES["Guns"] = { weapons: allGuns };
  const gunCategoryNames = gunDataFiles.map((c) => c.charAt(0).toUpperCase() + c.slice(1));

  await Promise.all(
    ["barrels", "grips", "others", "sights", "stocks"].map(async (category) => {
      const data = await fetch(`data/attachments/${category}.json`).then((r) => r.json());
      ITEM_CATEGORIES[category.charAt(0).toUpperCase() + category.slice(1)] = { weapons: Object.keys(data) };
      Object.assign(ITEM_STATS, data);
    }),
  );

  setWeapons(Object.keys(ITEM_STATS).sort());
  init(gunCategoryNames);
};

loadDataAndInit();
