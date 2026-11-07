import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { jobBalance, kindLabel } from "./jobs";
import { formatPhone, rupees } from "./shopTools";

export function longDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const who = (record) => ({ name: record.customer_name, phone: formatPhone(record.customer_phone) });
const issued = (record) => formatDateDDMMMYYYY(record.created_at ?? new Date());

export function jobSlip(job) {
  const details = [{ label: "Work", value: kindLabel(job.kind) }];
  if (job.items) details.push({ label: "Items", value: job.items });
  if (job.measurements) details.push({ label: "Notes", value: job.measurements });
  return {
    kind: "Alteration token",
    token: job.token,
    customer: who(job),
    highlight: { label: "Ready on", value: job.ready_on ? longDate(job.ready_on) : "We will call you" },
    details,
    money: [
      { label: "Charge", value: formatRupees(job.charge) },
      { label: "Advance paid", value: formatRupees(job.advance) },
      { label: "Balance", value: formatRupees(jobBalance(job)), big: true },
    ],
    note: `Bring this slip when you collect. Received ${issued(job)}.`,
    tag: {
      caption: "Shop copy · tie to the garment",
      lines: [job.customer_name || "Customer", `${kindLabel(job.kind)} · ready ${longDate(job.ready_on) || "—"}`, job.tailor ? `Tailor: ${job.tailor}` : ""].filter(Boolean),
    },
  };
}

const slipLines = (lines) =>
  lines.map((line) => ({ name: line.name, quantity: line.quantity, amount: formatRupees(rupees(line.price) * line.quantity) }));

export function approvalSlip(approval) {
  const total = approval.lines.reduce((sum, line) => sum + rupees(line.price) * line.quantity, 0);
  return {
    kind: "On approval",
    token: approval.token,
    customer: who(approval),
    highlight: { label: "Bring back by", value: longDate(approval.due_on) || "—" },
    lines: slipLines(approval.lines),
    money: [{ label: `${approval.lines.reduce((sum, line) => sum + line.quantity, 0)} pieces worth`, value: formatRupees(total), big: true }],
    note: `Taken on approval ${issued(approval)}. Pieces kept are billed at these prices; please return the rest unused with tags on. Customer signature: ____________`,
  };
}

export function bookingSlip(booking) {
  const balance = Math.max(0, rupees(booking.total) - rupees(booking.advance));
  return {
    kind: "Booking",
    token: booking.token,
    customer: who(booking),
    highlight: { label: "Pickup", value: longDate(booking.pickup_on) || "—" },
    lines: slipLines(booking.lines),
    money: [
      { label: "Total", value: formatRupees(booking.total) },
      { label: "Advance paid", value: formatRupees(booking.advance) },
      { label: "Balance at pickup", value: formatRupees(balance), big: true },
    ],
    note: `Booked ${issued(booking)}. Bring this slip at pickup.${booking.note ? ` ${booking.note}` : ""}`,
  };
}

export function creditNoteSlip(note) {
  const balance = rupees(note.amount) - rupees(note.redeemed);
  const money = [{ label: "Credit note value", value: formatRupees(note.amount), big: balance === rupees(note.amount) }];
  if (balance !== rupees(note.amount)) {
    money.push({ label: "Used", value: formatRupees(note.redeemed) }, { label: "Balance", value: formatRupees(balance), big: true });
  }
  return {
    kind: "Credit note",
    token: note.token,
    customer: who(note),
    highlight: { label: "Valid till", value: note.expires_on ? longDate(note.expires_on) : "No expiry" },
    details: note.source_bill ? [{ label: "Against bill", value: `#${note.source_bill}` }] : [],
    lines: slipLines(note.lines),
    money,
    note: `Issued ${issued(note)} for goods returned. Use it towards any purchase at the shop. Not payable in cash.`,
  };
}
