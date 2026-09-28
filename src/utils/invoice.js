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

/** Toast for products whose stock could not be moved, or null when all moved. */
export function stockWarningToast(failures) {
  if (!failures?.length) return null;
  const names = failures.map((failure) => failure.name).join(", ");
  return {
    title: "Stock not updated",
    description: `The bill was saved, but stock did not change for: ${names}. Fix these in Inventory.`,
    variant: "destructive",
  };
}

/** Last 10 digits, so "+91 98765-43210" and "9876543210" match. */
export function normalizePhone(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
}

/** Credit needs someone to collect it from. Returns an error message or null. */
export function creditCustomerError({ payments, customerName, customerNumber }) {
  if (toNumber(payments.credit) <= 0) return null;
  if (!String(customerName ?? "").trim()) return "Add the customer's name for a credit bill.";
  if (normalizePhone(customerNumber).length !== 10) {
    return "Add a 10-digit phone number for a credit bill.";
  }
  return null;
}
