export function phoneDigits(phone) {
  return String(phone ?? "").replace(/\D/g, "").slice(-10);
}

/** Last 10 digits of the phone, else the trimmed lowercase name. */
export function customerKey({ name, phone }) {
  const digits = phoneDigits(phone);
  if (digits.length === 10) return `phone:${digits}`;
  return `name:${String(name ?? "").trim().toLowerCase()}`;
}

export const invoiceCustomerKey = (invoice) =>
  customerKey({ name: invoice.customerName, phone: invoice.customerNumber });

/** Local YYYY-MM-DD; toISODate would give yesterday before 5:30 IST. */
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(date) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
}
