import { formatRupees } from "@/utils/formatters";

export const rupees = (value) => {
  const n = Math.round(Number(value) || 0);
  return n < 0 ? `−${formatRupees(-n)}` : formatRupees(n);
};
export const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const paise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const rupees2 = (value) => {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  return `${n < 0 ? "−" : ""}₹${paise.format(Math.abs(n))}`;
};

/** ₹1.2L / ₹3.4Cr / ₹12k for axes and tight spots. */
export function compactRupees(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
}

export const percent = (value, digits = 0) => (value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(digits)}%`);

const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const dayYearFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "long" });

const parseDay = (day) => new Date(`${day}T00:00:00`);
export const dayLabel = (day) => dayFormat.format(parseDay(day));
export const dayYearLabel = (value) => dayYearFormat.format(typeof value === "string" ? parseDay(value) : value);
export const monthLabel = (month) => monthFormat.format(parseDay(`${month}-01`));
export const weekdayLabel = (day) => weekdayFormat.format(parseDay(day));
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function hourLabel(hour) {
  const suffix = hour < 12 ? "am" : "pm";
  return `${hour % 12 || 12}${suffix}`;
}

export function rangeLabel({ from, to } = {}) {
  if (!from && !to) return "all time";
  if (from === to) return dayYearLabel(from);
  return `${from ? dayYearLabel(from) : "start"} to ${to ? dayYearLabel(to) : "today"}`;
}
