import { FINANCIAL_YEAR_START_MONTH } from "@/config/business";

const pad = (value) => String(value).padStart(2, "0");
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const RANGE_PRESETS = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "fy", label: "This FY" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

/** Resolves a preset to inclusive YYYY-MM-DD bounds; empty means unbounded. */
export function resolveRange(preset, custom = {}, today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (preset) {
    case "month":
      return { from: iso(new Date(year, month, 1)), to: iso(today) };
    case "last-month":
      return { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) };
    case "fy": {
      const startYear = month < FINANCIAL_YEAR_START_MONTH ? year - 1 : year;
      return { from: iso(new Date(startYear, FINANCIAL_YEAR_START_MONTH, 1)), to: iso(today) };
    }
    case "custom":
      return { from: custom.from ?? "", to: custom.to ?? "" };
    default:
      return { from: "", to: "" };
  }
}

export function applyRange(query, { from, to } = {}, column = "date") {
  let ranged = query;
  if (from) ranged = ranged.gte(column, `${from}T00:00:00`);
  if (to) ranged = ranged.lte(column, `${to}T23:59:59`);
  return ranged;
}
