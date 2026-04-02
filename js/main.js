import { WEAPON_STATS, WEAPON_CATEGORIES, weapons, STATS, setWeapons } from "./config.js";
import { selectLeft, selectRight, classFilter, sortStat, searchInput, sortOrder, dpsTime, dpsMultiplier, pelletHitPercent, dpsDistance, searchResults } from "./dom.js";
import { renderComparison, renderSearch, updateUIState } from "./render.js";

const init = () => {
  const weaponOptionsHtml = weapons.map((weapon) => `<option value="${weapon}">${weapon}</option>`).join("");
  selectLeft.innerHTML = weaponOptionsHtml;
  selectRight.innerHTML = weaponOptionsHtml;
  selectRight.selectedIndex = Math.min(1, weapons.length - 1);

  classFilter.innerHTML = ['<option value="all">All Classes</option>', ...Object.keys(WEAPON_CATEGORIES).map((weaponClass) => `<option value="${weaponClass}">${weaponClass}</option>`)].join("");

  sortStat.innerHTML = STATS.map((stat) => `<option value="${stat.key}">${stat.label}</option>`).join("");

  updateUIState();
  renderComparison();
  renderSearch();

  const reRenderAll = () => {
    renderComparison();
    renderSearch();
  };

  [selectLeft, selectRight].forEach((element) => element.addEventListener("change", renderComparison));
  sortStat.addEventListener("change", () => {
    updateUIState();
    renderSearch();
  });
  searchInput.addEventListener("input", renderSearch);
  [classFilter, sortOrder].forEach((element) => element.addEventListener("change", renderSearch));

  [dpsTime, dpsMultiplier, pelletHitPercent, dpsDistance].forEach((element) => {
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
  const categories = ["lmgs", "pistols", "rifles", "shotguns", "smgs", "snipers", "specials"];

  await Promise.all(
    categories.map(async (category) => {
      const data = await fetch(`data/guns/${category}.json`).then((response) => response.json());
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      WEAPON_CATEGORIES[formattedCategory] = { weapons: Object.keys(data) };
      Object.assign(WEAPON_STATS, data);
    }),
  );

  setWeapons(Object.keys(WEAPON_STATS).sort());
  init();
};

loadDataAndInit();
