import { BUSINESS } from "@/config/business";
import { formatRupees, toNumber } from "@/utils/formatters";

/** Adds the bill link to a message that doesn't carry it yet, e.g. an edited template. */
export function withBillLink(text, link) {
  if (!link || text.includes(link)) return text;
  return `${text}\n${link}`.trim();
}

/** Plain text that goes with a shared bill: total, what is due, and the link. */
export function billShareText(invoice, link) {
  const due = toNumber(invoice.credit);
  return [
    `${BUSINESS.displayName} bill #${invoice.id}: ${formatRupees(invoice.total)}`,
    due > 0 ? `Due: ${formatRupees(due)}${link ? ", pay by UPI here:" : ""}` : null,
    link,
  ]
    .filter(Boolean)
    .join("\n");
}
