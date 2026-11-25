import { compilePatterns, DEFAULT_NON_SALE } from "@/features/reports/lib/lines";

const num = (value) => Number(value) || 0;

/** Bill lines are stored as JSON text, sometimes wrapped twice. */
export function billLines(products) {
  let value = products;
  for (let i = 0; i < 2 && typeof value === "string"; i += 1) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

/** Each goods line of a bill with what was sold, what already came back and what can still go back. */
export function returnableLines(invoice, notes, nonSalePatterns = DEFAULT_NON_SALE) {
  const nonSale = compilePatterns(nonSalePatterns);
  const returned = new Map();
  for (const note of notes) {
    for (const line of note.lines ?? []) {
      returned.set(line.bill_line, (returned.get(line.bill_line) ?? 0) + num(line.quantity));
    }
  }

  return billLines(invoice.products).map((line, index) => {
    const sold = num(line.quantity) || 1;
    const amount = line.amount != null && line.amount !== "" ? num(line.amount) : num(line.price) * sold;
    const name = String(line.name ?? "").trim();
    const goods = amount > 0 && sold > 0 && !nonSale.some((pattern) => pattern.test(name));
    const back = returned.get(index) ?? 0;
    return { index, name, barcode: line.barcode ?? null, sold, returned: back, left: goods ? Math.max(0, sold - back) : 0, unit: sold ? amount / sold : 0, goods };
  });
}

export const returnTotal = (lines, quantities) =>
  Math.round(lines.reduce((sum, line) => sum + line.unit * Math.min(num(quantities[line.index]), line.left), 0) * 100) / 100;

/** The usual refund: take it off what the customer still owes on the bill, give the rest back in cash. */
export function suggestRefund(total, due) {
  const amount = Math.round(total);
  const toDue = Math.min(Math.max(num(due), 0), amount);
  return { cash: amount - toDue, upi: 0, due: toDue };
}

export const daysSince = (date, now = Date.now()) => Math.floor((now - new Date(date).getTime()) / 86_400_000);

/** Note's refund split as slip and screen text. */
export function refundParts(note) {
  const cash = num(note.refund_cash);
  const upi = num(note.refund_upi);
  const due = num(note.refund_due);
  const credit = Math.max(0, num(note.amount) - num(note.redeemed) - cash - upi - due);
  return { cash, upi, due, credit };
}
