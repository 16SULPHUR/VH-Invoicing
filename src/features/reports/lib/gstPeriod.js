import { iso } from "../range/reportRange";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const fyOf = (date) => (date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear());
export const fyLabel = (startYear) => `${startYear}-${String(startYear + 1).slice(2)}`;

/** "2026-08" is a month, "2026-Q2" a quarter of the financial year starting April 2026, "2026-FY" the whole year. */
export function resolveGstPeriod(key) {
  const [yearText, part] = key.split("-");
  const year = Number(yearText);
  if (part === "FY") {
    return { key, kind: "year", from: `${year}-04-01`, to: iso(new Date(year + 1, 3, 0)), label: `FY ${fyLabel(year)}` };
  }
  if (part.startsWith("Q")) {
    const q = Number(part.slice(1));
    const startMonth = 3 + (q - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return { key, kind: "quarter", from: iso(start), to: iso(end), label: `Q${q} ${fyLabel(year)} (${MONTHS[start.getMonth()]} to ${MONTHS[end.getMonth()]})` };
  }
  const month = Number(part) - 1;
  return { key, kind: "month", from: iso(new Date(year, month, 1)), to: iso(new Date(year, month + 1, 0)), label: `${MONTHS[month]} ${year}` };
}

/** The period being prepared: last month, or for quarterly filers the current quarter once in its last month, else the one before. */
export function defaultGstPeriod(frequency = "quarterly", today = new Date()) {
  if (frequency === "monthly") {
    const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
  }
  const fyMonth = (today.getMonth() + 9) % 12;
  const inLastMonth = fyMonth % 3 === 2;
  let quarter = Math.floor(fyMonth / 3) + (inLastMonth ? 1 : 0);
  let fy = fyOf(today);
  if (quarter === 0) {
    quarter = 4;
    fy -= 1;
  }
  return `${fy}-Q${quarter}`;
}

export function monthOptions(fyStart) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(fyStart, 3 + i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()] };
  });
}

export const quarterOptions = (fyStart) => [1, 2, 3, 4].map((q) => ({ value: `${fyStart}-Q${q}`, label: `Q${q}` }));

/** fy start year of the period key */
export function periodFy(key) {
  const [year, part] = key.split("-");
  if (part === "FY" || part.startsWith("Q")) return Number(year);
  return Number(part) < 4 ? Number(year) - 1 : Number(year);
}

const dayMonth = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** GSTR-1 by the 11th (13th for quarterly filers), GSTR-3B by the 20th (22nd for quarterly filers in Gujarat). */
export function dueDates(period) {
  const end = new Date(`${period.to}T00:00:00`);
  const next = (day) => new Date(end.getFullYear(), end.getMonth() + 1, day);
  if (period.kind === "quarter") return { gstr1: dayMonth(next(13)), gstr3b: dayMonth(next(22)) };
  if (period.kind === "month") return { gstr1: dayMonth(next(11)), gstr3b: dayMonth(next(20)) };
  return { gstr1: null, gstr3b: null };
}
