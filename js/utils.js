import { ITEM_CATEGORIES } from "./config.js";

export const parseAmmo = (value) => {
  if (value === "inf") return Infinity;
  if (typeof value === "string" && value.includes("+")) {
    return value.split("+").reduce((sum, num) => sum + Number(num), 0);
  }
  return Number(value) || 0;
};

export const getWeaponClass = (weaponName) => Object.entries(ITEM_CATEGORIES).find(([_, cat]) => cat.weapons.includes(weaponName))?.[0] || "Unknown";

export const getComparisonClass = (left, right, higherIsBetter) => {
  if (left === right) return "same";
  if (isNaN(left) || isNaN(right)) return "";
  const isBetter = higherIsBetter ? left > right : left < right;
  return isBetter ? "better" : "worse";
};

export const getInputValue = (element, defaultValue) => {
  const value = parseFloat(element.value);
  return isNaN(value) ? defaultValue : value;
};
