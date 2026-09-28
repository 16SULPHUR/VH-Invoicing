import { creditCustomerError, invoiceTotal, lineAmount } from "@/utils/invoice";
import { toNumber } from "@/utils/formatters";

// Older jobs wait for someone at the till to press Print, so a bill tapped this
// morning doesn't come out of the printer at night.
const FRESH_JOB_MS = 10 * 60 * 1000;

export const isFresh = (job) =>
  Date.now() - new Date(job.updated_at || job.created_at).getTime() < FRESH_JOB_MS;

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "credit", label: "Credit" },
];

export function jobLines(job) {
  return (job.items || []).map((item) => ({
    name: item.name,
    barcode: item.barcode,
    quantity: toNumber(item.quantity),
    price: toNumber(item.price),
    amount: lineAmount(item),
  }));
}

export function jobPayments(mode, total) {
  return {
    cash: mode === "cash" ? total : "",
    upi: mode === "upi" ? total : "",
    credit: mode === "credit" ? total : "",
  };
}

/** Why the job can't become a bill, or null. Checked on the phone and again at the till. */
export function printJobError({ items, payment_mode: mode, customer_name, customer_phone }) {
  if (!items?.length) return "Scan at least one product first.";
  if (!mode) return "Choose how the customer paid: Cash, UPI or Credit.";
  return creditCustomerError({
    payments: jobPayments(mode, 1),
    customerName: customer_name,
    customerNumber: customer_phone,
  });
}

/** The create_bill payload for a job, in the same shape the till saves. */
export function billFromJob(job) {
  const lines = jobLines(job);
  const total = invoiceTotal(lines);
  const payments = jobPayments(job.payment_mode, total);
  return {
    lines,
    total,
    payments,
    payload: {
      customerName: job.customer_name.trim(),
      customerNumber: job.customer_phone.trim(),
      products: JSON.stringify(lines),
      total,
      cash: toNumber(payments.cash),
      upi: toNumber(payments.upi),
      credit: toNumber(payments.credit),
      note: job.note || "",
      date: new Date().toISOString(),
    },
  };
}
