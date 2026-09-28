import { toNumber } from "./formatters";

export function lineAmount(line) {
  return toNumber(line.price) * toNumber(line.quantity);
}

export function invoiceTotal(lines) {
  return (lines || []).reduce((sum, line) => sum + toNumber(line.amount), 0);
}

export function invoiceItemCount(lines) {
  return (lines || []).reduce((sum, line) => sum + toNumber(line.quantity), 0);
}

export function paymentsTotal({ cash, upi, credit }) {
  return toNumber(cash) + toNumber(upi) + toNumber(credit);
}

/**
 * Payments must either add up to the invoice total or be left entirely blank
 * (the till allows printing before the customer has chosen how to pay).
 */
export function paymentsBalance({ cash, upi, credit }, total, { allowUnpaid = false } = {}) {
  const paid = paymentsTotal({ cash, upi, credit });
  if (allowUnpaid && paid === 0) return true;
  return Math.abs(paid - toNumber(total)) < 0.01;
}

export function parseInvoiceLines(products) {
  if (!products) return [];
  if (Array.isArray(products)) return products;
  try {
    return JSON.parse(products);
  } catch {
    return [];
  }
}

export function buildUpiLink({ upiId, businessName, amount, merchantCode, transactionRef }) {
  const params = new URLSearchParams({ pa: upiId, pn: businessName });
  if (merchantCode) params.set("mc", merchantCode);
  params.set("am", String(amount ?? ""));
  if (transactionRef) params.set("tr", transactionRef);
  params.set("cu", "INR");
  return `upi://pay?${params.toString()}`;
}
