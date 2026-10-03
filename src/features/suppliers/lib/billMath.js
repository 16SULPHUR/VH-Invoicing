import { localISODate } from "@/utils/date";

export const DEFAULT_CREDIT_DAYS = 60;
export const DUE_SOON_DAYS = 7;
export const GST_RATES = [0, 5, 12, 18];

export const MODES = [
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];
export const modeLabel = (mode) => MODES.find((entry) => entry.value === mode)?.label ?? "";

export const KIND_LABEL = { payment: "Payment", return: "Goods return", discount: "Kasar / discount" };

export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const DAY = 86_400_000;
const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const daysBetween = (fromIso, toIso) => dayNumber(toIso) - dayNumber(fromIso);

/** Total is what the supplier bills; GST is already inside it. */
export function gstSplit(total, rate) {
  const gross = Number(total) || 0;
  const taxable = round2(gross / (1 + (Number(rate) || 0) / 100));
  return { taxable, gst: round2(gross - taxable) };
}

/** 24 is Gujarat; a supplier GSTIN from another state means IGST. */
export function isInterState(gstin, shopStateCode = "24") {
  const code = String(gstin ?? "").trim().slice(0, 2);
  return /^\d{2}$/.test(code) && code !== shopStateCode;
}

export function describeBill(bill, payments, today = localISODate()) {
  const own = payments.filter((payment) => payment.bill_id === bill.id);
  const sum = (kind) => own.filter((p) => p.kind === kind).reduce((acc, p) => acc + Number(p.amount), 0);
  const paid = round2(sum("payment"));
  const returned = round2(sum("return"));
  const discount = round2(sum("discount"));
  const outstanding = round2(Number(bill.total) - paid - returned - discount);
  const daysLeft = daysBetween(today, bill.due_date);

  let status = "unpaid";
  if (outstanding <= 0) status = "paid";
  else if (daysLeft < 0) status = "overdue";
  else if (paid + returned + discount > 0) status = "partial";

  return { ...bill, payments: own, paid, returned, discount, outstanding, daysLeft, status };
}

export function dueText(bill) {
  if (bill.status === "paid") return "Settled";
  if (bill.daysLeft < 0) return `${-bill.daysLeft} day${bill.daysLeft === -1 ? "" : "s"} overdue`;
  if (bill.daysLeft === 0) return "Due today";
  return `${bill.daysLeft} day${bill.daysLeft === 1 ? "" : "s"} left`;
}

export const STATUS_LABEL = { unpaid: "Unpaid", partial: "Part paid", overdue: "Overdue", paid: "Paid" };

/** Spreads an amount over bills, earliest due date first. */
export function allocateOldestFirst(bills, amount) {
  let left = round2(amount);
  const result = {};
  const open = bills
    .filter((bill) => bill.outstanding > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.bill_date.localeCompare(b.bill_date));
  for (const bill of open) {
    if (left <= 0) break;
    const share = Math.min(left, bill.outstanding);
    result[bill.id] = share;
    left = round2(left - share);
  }
  return result;
}

export function supplierTotals(bills) {
  let billed = 0;
  let outstanding = 0;
  let overdue = 0;
  for (const bill of bills) {
    billed += Number(bill.total);
    outstanding += bill.outstanding;
    if (bill.status === "overdue") overdue += bill.outstanding;
  }
  return { billed: round2(billed), outstanding: round2(outstanding), overdue: round2(overdue) };
}

export const shortDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "";
