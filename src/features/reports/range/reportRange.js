import { FINANCIAL_YEAR_START_MONTH } from "@/config/business";

const pad = (value) => String(value).padStart(2, "0");
export const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "quarter", label: "This quarter" },
  { value: "fy", label: "This FY" },
  { value: "last-fy", label: "Last FY" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

const fyStartYear = (today) => (today.getMonth() < FINANCIAL_YEAR_START_MONTH ? today.getFullYear() - 1 : today.getFullYear());

/** Resolves a preset to inclusive YYYY-MM-DD bounds; empty means unbounded. */
export function resolveRange(preset, custom = {}, today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (preset) {
    case "today":
      return { from: iso(today), to: iso(today) };
    case "7d":
      return { from: iso(new Date(year, month, today.getDate() - 6)), to: iso(today) };
    case "month":
      return { from: iso(new Date(year, month, 1)), to: iso(today) };
    case "last-month":
      return { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) };
    case "quarter": {
      const startMonth = month - ((month - FINANCIAL_YEAR_START_MONTH + 12) % 3);
      return { from: iso(new Date(year, startMonth, 1)), to: iso(today) };
    }
    case "fy":
      return { from: iso(new Date(fyStartYear(today), FINANCIAL_YEAR_START_MONTH, 1)), to: iso(today) };
    case "last-fy": {
      const start = fyStartYear(today) - 1;
      return { from: iso(new Date(start, FINANCIAL_YEAR_START_MONTH, 1)), to: iso(new Date(start + 1, FINANCIAL_YEAR_START_MONTH, 0)) };
    }
    case "custom":
      return { from: custom.from ?? "", to: custom.to ?? "" };
    default:
      return { from: "", to: "" };
  }
}

const shiftMonths = (day, months) => {
  const [y, m, d] = day.split("-").map(Number);
  const lastDay = new Date(y, m - 1 + months + 1, 0).getDate();
  return iso(new Date(y, m - 1 + months, Math.min(d, lastDay)));
};

const shiftDays = (day, days) => {
  const [y, m, d] = day.split("-").map(Number);
  return iso(new Date(y, m - 1, d + days));
};

/** The period this one is compared against: the one just before it, same length. */
export function previousRange(preset, range) {
  if (!range.from || !range.to) return null;
  const months = { month: 1, "last-month": 1, quarter: 3, fy: 12, "last-fy": 12 }[preset];
  if (months) return { from: shiftMonths(range.from, -months), to: shiftMonths(range.to, -months) };
  const length = Math.round((new Date(range.to) - new Date(range.from)) / 86_400_000) + 1;
  return { from: shiftDays(range.from, -length), to: shiftDays(range.to, -length) };
}

export function lastYearRange(range) {
  if (!range.from || !range.to) return null;
  return { from: shiftMonths(range.from, -12), to: shiftMonths(range.to, -12) };
}

export const inRange = (day, { from, to } = {}) => (!from || day >= from) && (!to || day <= to);

export function applyRange(query, { from, to } = {}, column = "date") {
  let ranged = query;
  if (from) ranged = ranged.gte(column, new Date(`${from}T00:00:00`).toISOString());
  if (to) ranged = ranged.lte(column, new Date(new Date(`${to}T00:00:00`).getTime() + 86_399_999).toISOString());
  return ranged;
}
