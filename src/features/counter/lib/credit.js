import { daysUntil, rupees } from "./shopTools";

export const creditBalance = (note) => Math.max(0, rupees(note.amount) - rupees(note.redeemed));

export const isExpired = (note) => Boolean(note.expires_on) && (daysUntil(note.expires_on) ?? 0) < 0;

export const isUsable = (note) => note.status === "open" && creditBalance(note) > 0;

export const CREDIT_STATUS = {
  open: { label: "Open", tone: "leaf" },
  used: { label: "Used", tone: "neutral" },
  void: { label: "Void", tone: "red" },
};

export const EXPIRY_CHOICES = [
  { value: 0, label: "No expiry" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

/** Matches a line of an old bill to a product: by code first, then by name. */
export function productForBillLine(products, line) {
  const code = String(line.barcode ?? "").trim();
  if (code) {
    const byCode = products.find((product) => String(product.barcode ?? "") === code);
    if (byCode) return byCode;
  }
  const name = String(line.name ?? "").trim().toLowerCase();
  return products.find((product) => String(product.name ?? "").trim().toLowerCase() === name) ?? null;
}
