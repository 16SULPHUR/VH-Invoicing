import { BUSINESS } from "@/config/business";

const currencyFormatter = new Intl.NumberFormat(BUSINESS.locale, {
  style: "currency",
  currency: BUSINESS.currency,
  maximumFractionDigits: 2,
});

export function formatINR(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}

export function formatAmount(amount) {
  return (Number(amount) || 0).toFixed(2);
}

export function toNumber(value) {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

const groupedFormatter = new Intl.NumberFormat(BUSINESS.locale, { maximumFractionDigits: 2 });

/** Display money with Indian grouping: ₹1,24,500 or ₹2,940.50. */
export function formatRupees(amount) {
  return `₹${groupedFormatter.format(Number(amount) || 0)}`;
}
