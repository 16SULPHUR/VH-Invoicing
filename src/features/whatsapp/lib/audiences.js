import { customerKey, daysSince, invoiceCustomerKey, phoneDigits } from "@/features/customers/lib/customerKey";
import { groupByCustomer } from "@/features/customers/hooks/useCreditReport";
import { waNumber } from "./waLink";

const DAY = 86_400_000;

/** Days from today to the next month-day of a stored date ("2000-03-14"), or null. */
export function daysUntil(date) {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(String(date ?? ""));
  if (!match) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), Number(match[1]) - 1, Number(match[2]));
  if (next < today) next = new Date(today.getFullYear() + 1, Number(match[1]) - 1, Number(match[2]));
  return Math.round((next - today) / DAY);
}

const blankEntry = (key) => ({
  key,
  name: "",
  phone: "",
  recordId: null,
  optin: false,
  optinAt: null,
  optoutAt: null,
  birthday: null,
  anniversary: null,
  bills: 0,
  spendYear: 0,
  lastVisit: null,
  latestBill: null,
  due: 0,
  dueBills: [],
  oldestDays: 0,
});

function applyConsent(entry, source) {
  if (source.wa_optin !== undefined) entry.optin = Boolean(source.wa_optin);
  if (source.wa_optin_at !== undefined) entry.optinAt = source.wa_optin_at;
  if (source.wa_optout_at !== undefined) entry.optoutAt = source.wa_optout_at;
  if (source.birthday !== undefined) entry.birthday = source.birthday;
  if (source.anniversary !== undefined) entry.anniversary = source.anniversary;
}

/**
 * One row per customer key from bills and the customers list, with spend, last visit
 * and dues. Dues come from the credit report's own grouping.
 */
export function buildDirectory(invoices, customers, localConsent = {}) {
  const entries = new Map();
  const yearAgo = new Date(Date.now() - 365 * DAY).toISOString();
  const newestFirst = [...invoices].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  for (const invoice of newestFirst) {
    const key = invoiceCustomerKey(invoice);
    let entry = entries.get(key);
    if (!entry) {
      entry = blankEntry(key);
      entry.name = String(invoice.customerName ?? "").trim();
      entry.phone = phoneDigits(invoice.customerNumber);
      entry.lastVisit = invoice.date;
      entry.latestBill = { id: invoice.id, date: invoice.date, total: Number(invoice.total) || 0 };
      entries.set(key, entry);
    }
    entry.bills += 1;
    if (String(invoice.date) >= yearAgo) entry.spendYear += Number(invoice.total) || 0;
  }

  for (const group of groupByCustomer(invoices.filter((invoice) => Number(invoice.credit) > 0))) {
    const entry = entries.get(group.key);
    entry.due = group.totalCredit;
    entry.dueBills = [...group.invoices]
      .reverse()
      .map(({ id, date, credit }) => ({ id, date, credit: Number(credit) || 0 }));
    entry.oldestDays = daysSince(entry.dueBills[0].date);
  }

  for (const row of customers) {
    const key = customerKey(row);
    const entry = entries.get(key) ?? blankEntry(key);
    entry.name = String(row.name ?? "").trim() || entry.name;
    entry.phone = phoneDigits(row.phone).length === 10 ? phoneDigits(row.phone) : entry.phone;
    entry.recordId = row.id;
    applyConsent(entry, row);
    entries.set(key, entry);
  }

  for (const [key, consent] of Object.entries(localConsent)) {
    const entry = entries.get(key);
    if (entry && !entry.recordId) applyConsent(entry, consent);
  }

  return [...entries.values()].filter((entry) => entry.name || entry.phone);
}

const withPhone = (entry) => Boolean(waNumber(entry.phone));
const byName = (a, b) => a.name.localeCompare(b.name);

export const AUDIENCES = [
  {
    id: "dues",
    label: "Dues round",
    hint: "Everyone who owes, oldest bill first. Gentle, firm or final by bill age.",
    template: "auto",
    pick: (list) => list.filter((entry) => entry.due > 0).sort((a, b) => b.oldestDays - a.oldestDays),
  },
  {
    id: "credit",
    label: "Owe money",
    hint: "Everyone with dues, most owed first.",
    template: "dues_gentle",
    pick: (list) => list.filter((entry) => entry.due > 0).sort((a, b) => b.due - a.due),
  },
  {
    id: "everyone",
    label: "Everyone",
    hint: "Every customer with a phone number.",
    template: "new_arrivals",
    pick: (list) => list.filter(withPhone).sort(byName),
  },
  {
    id: "top",
    label: "Top 20",
    hint: "The 20 biggest spenders of the last 12 months.",
    template: "new_arrivals",
    pick: (list) =>
      list
        .filter((entry) => entry.spendYear > 0)
        .sort((a, b) => b.spendYear - a.spendYear)
        .slice(0, 20),
  },
  {
    id: "lapsed",
    label: "Not seen 90 days",
    hint: "Bought before, but not in the last 90 days.",
    template: "winback",
    pick: (list) =>
      list
        .filter((entry) => entry.lastVisit && daysSince(entry.lastVisit) >= 90)
        .sort((a, b) => String(b.lastVisit).localeCompare(String(a.lastVisit))),
  },
  {
    id: "keyword",
    label: "Bought…",
    hint: "Bought something with this word in its name.",
    template: "new_arrivals",
    pick: (list, { keywordKeys }) => list.filter((entry) => keywordKeys?.has(entry.key)).sort(byName),
  },
  {
    id: "birthdays",
    label: "Birthdays",
    hint: "Birthdays today and in the next 6 days.",
    template: "birthday",
    pick: (list) =>
      list
        .filter((entry) => (daysUntil(entry.birthday) ?? 99) < 7)
        .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday)),
  },
  {
    id: "anniversaries",
    label: "Anniversaries",
    hint: "Anniversaries today and in the next 6 days.",
    template: "anniversary",
    pick: (list) =>
      list
        .filter((entry) => (daysUntil(entry.anniversary) ?? 99) < 7)
        .sort((a, b) => daysUntil(a.anniversary) - daysUntil(b.anniversary)),
  },
];

export const audienceById = (id) => AUDIENCES.find((audience) => audience.id === id) ?? AUDIENCES[0];

/**
 * Why a customer is left out of this send, or null to send. Reminders and thank-yous are
 * transactional and allowed without opt-in; offers need a yes and respect the monthly cap.
 */
export function holdReason(entry, { kind, campaign, rules, history, optedInOnly }) {
  if (!waNumber(entry.phone)) return "No phone number";
  const needsYes = kind === "marketing" || optedInOnly;
  if (needsYes && !entry.optin) return entry.optoutAt ? "Stopped offers" : "Hasn't said yes to offers";

  const sent = history.filter((log) => log.status === "sent");
  if (kind === "dues") {
    const last = sent.find((log) => log.kind === "dues");
    const days = last ? daysSince(last.created_at) : Infinity;
    if (days < rules.duesGapDays) return days === 0 ? "Reminded today" : `Reminded ${days}d ago`;
    return null;
  }
  if (campaign && sent.some((log) => log.campaign === campaign)) return "Already got this";
  if (kind === "marketing") {
    const monthAgo = new Date(Date.now() - 30 * DAY).toISOString();
    const offers = sent.filter((log) => log.kind === "marketing" && log.created_at >= monthAgo).length;
    if (offers >= rules.offersPerMonth) return `${offers} offers in 30 days`;
  }
  return null;
}
