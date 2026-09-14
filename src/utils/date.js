import { FINANCIAL_YEAR_START_MONTH, FINANCIAL_YEAR_OPTION_COUNT } from "@/config/business";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toISODate(date = new Date()) {
  return new Date(date).toISOString().split("T")[0];
}

export function startOfDay(isoDate) {
  return `${isoDate}T00:00:00`;
}

export function endOfDay(isoDate) {
  return `${isoDate}T23:59:59`;
}

/** "05/09" — the compact label used in the recent invoices list. */
export function formatDayMonth(date) {
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function formatDateDDMMMYYYY(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad(d.getDate())} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
}

/** "05/09/2025 FRI" — the header shown while an invoice is being written. */
export function formatInvoiceHeaderDate(date = new Date()) {
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${WEEKDAYS[d.getDay()]}`;
}

export function currentFinancialYear(today = new Date()) {
  const year = today.getFullYear();
  return today.getMonth() < FINANCIAL_YEAR_START_MONTH
    ? `${year - 1}-${year}`
    : `${year}-${year + 1}`;
}

export function financialYearOptions(today = new Date()) {
  const year = today.getFullYear();
  return Array.from(
    { length: FINANCIAL_YEAR_OPTION_COUNT },
    (_, index) => `${year - index}-${year - index + 1}`
  );
}

export function financialYearRange(yearRange) {
  const [startYear, endYear] = yearRange.split("-");
  return { startDate: `${startYear}-04-01`, endDate: `${endYear}-03-31T23:59:59` };
}

/** Resolves the sales-summary dropdown into an inclusive ISO datetime range. */
export function salesPeriodRange(period, customRange = {}) {
  const today = toISODate();

  if (period === "custom") {
    return { startDate: startOfDay(customRange.start), endDate: endOfDay(customRange.end) };
  }
  if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { startDate: startOfDay(toISODate(weekAgo)), endDate: endOfDay(today) };
  }
  if (period === "month") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfDay(toISODate(monthStart)), endDate: endOfDay(today) };
  }
  return { startDate: startOfDay(today), endDate: endOfDay(today) };
}
