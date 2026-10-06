import { balanceAsOf } from "./balances";

export const HANDOVER_PREFIX = "Handover";
export const PAYOUT_REASONS = ["Bank deposit", "Person", "Expense", "Other"];

const NUMBER = "(-?\\d+(?:\\.\\d+)?)";

export function closeNote({ date, expected, counted, taken }) {
  return `Closed ${date} · expected ${expected} · counted ${counted} · taken home ${taken}`;
}

function parseCloseNote(note) {
  const text = note ?? "";
  const pick = (label) => {
    const match = text.match(new RegExp(`${label} ${NUMBER}`));
    return match ? Number(match[1]) : null;
  };
  return {
    date: text.match(/^Closed (\d{4}-\d{2}-\d{2})/)?.[1] ?? null,
    expected: pick("expected"),
    counted: pick("counted"),
  };
}

export function payoutDescription(reason, detail) {
  const clean = detail.trim();
  return clean ? `${reason} · ${clean}` : reason;
}

export function payoutReason(transaction) {
  const [first, ...rest] = (transaction.description ?? "").split(" · ");
  const detail = rest.join(" · ");
  if (transaction.type === "bank_deposit") return { label: "Bank deposit", detail: detail || "" };
  if (PAYOUT_REASONS.includes(first)) return { label: first, detail };
  return { label: "Other", detail: transaction.description ?? "" };
}

export function isHandover(transaction) {
  return (transaction.description ?? "").startsWith(HANDOVER_PREFIX);
}

const money = (value) => String(Math.round(Number(value) || 0));

export function discordLine(row) {
  const lines = [];
  if (row.brought > 0) {
    lines.push(
      `HOME-${money(row.homeBeforeHandover)}+${money(row.brought)}=${money(row.homeBeforeHandover + row.brought)}`
    );
  }
  let running = row.homeBeforeHandover + row.brought;
  for (const payout of row.payouts) {
    const label = payout.detail
      ? `${payout.label.toLowerCase()}: ${payout.detail}`
      : payout.label.toLowerCase();
    const next = running - payout.amount;
    lines.push(`${money(running)}-${money(payout.amount)}[${label}] = ${money(next)}`);
    running = next;
  }
  if (row.shopLeft !== null) lines.push(`SHOP-${money(row.shopLeft)}`);
  return lines.join("\n");
}

/** One row per day, newest first, derived from HOME entries and SHOP counts. */
export function buildHistory({ accounts, transactions, reconciliations }) {
  const idOf = (name) => accounts.find((account) => account.name.toUpperCase() === name)?.id;
  const homeId = idOf("HOME");
  const shopId = idOf("SHOP");
  const data = { transactions, reconciliations };

  const counts = new Map();
  for (const snapshot of reconciliations) {
    if (snapshot.account_id !== shopId) continue;
    const parsed = parseCloseNote(snapshot.note);
    const day = parsed.date ?? snapshot.as_of_date;
    const previous = counts.get(day);
    if (!previous || snapshot.created_at > previous.snapshot.created_at) {
      counts.set(day, { snapshot, parsed });
    }
  }

  const homeByDay = new Map();
  for (const transaction of transactions) {
    if (transaction.account_id !== homeId) continue;
    const list = homeByDay.get(transaction.txn_date) ?? [];
    list.push(transaction);
    homeByDay.set(transaction.txn_date, list);
  }

  const days = [...new Set([...counts.keys(), ...homeByDay.keys()])].sort().reverse();

  return days.map((date) => {
    const entries = homeByDay.get(date) ?? [];
    const count = counts.get(date);
    const brought = entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const payouts = entries
      .filter((e) => e.amount < 0)
      .map((e) => ({ id: e.id, amount: Math.abs(Number(e.amount)), ...payoutReason(e) }));
    const paid = payouts.reduce((sum, p) => sum + p.amount, 0);
    const homeAfter = balanceAsOf(data, homeId, date);
    const closedByApp = Boolean(count?.parsed.date);
    const hasCounts = count?.parsed.expected !== null && count?.parsed.counted !== null && count;

    return {
      date,
      brought,
      payouts,
      paid,
      homeAfter,
      homeBeforeHandover: homeAfter - brought + paid,
      shopLeft: count ? Number(count.snapshot.balance) : null,
      difference: hasCounts ? count.parsed.counted - count.parsed.expected : null,
      by: count?.snapshot.author || entries.find((e) => e.author)?.author || "",
      reconId: closedByApp ? count.snapshot.id : null,
      handoverIds: entries.filter(isHandover).map((e) => e.id),
    };
  });
}

export function summarizeMonths(rows) {
  const months = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    const month = months.get(key) ?? {
      key,
      brought: 0,
      byReason: new Map(),
      people: new Map(),
      shopLeftTotal: 0,
      shopLeftDays: 0,
      difference: 0,
    };
    month.brought += row.brought;
    for (const payout of row.payouts) {
      month.byReason.set(payout.label, (month.byReason.get(payout.label) ?? 0) + payout.amount);
      if (payout.label === "Person" && payout.detail) {
        const name = payout.detail.trim();
        month.people.set(name, (month.people.get(name) ?? 0) + payout.amount);
      }
    }
    if (row.shopLeft !== null) {
      month.shopLeftTotal += row.shopLeft;
      month.shopLeftDays += 1;
    }
    if (row.difference !== null) month.difference += row.difference;
    months.set(key, month);
  }
  return [...months.values()].sort((a, b) => b.key.localeCompare(a.key));
}
