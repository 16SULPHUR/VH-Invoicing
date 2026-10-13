import { supabase, unwrap } from "@/lib/supabase";
import { applyRange } from "@/features/reports/range/reportRange";

const PAGE = 1000;

export async function readAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(await build().range(from, from + PAGE - 1)) || [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export function getTransactions(range) {
  return readAll(() =>
    applyRange(supabase.from("transactions").select("*"), range).order("date", { ascending: false }).order("id")
  );
}

export function getLedger(range) {
  return readAll(() =>
    applyRange(supabase.from("ledger_view").select("*"), range).order("date").order("transaction_id")
  );
}

/** Balances as of the range's end date. */
export async function getTrialBalance(range) {
  const data = await readAll(() =>
    applyRange(supabase.from("ledger_view").select("account_name, debit, credit"), { to: range?.to }).order("transaction_id")
  );

  const balance = {};
  data.forEach(({ account_name, debit, credit }) => {
    if (!balance[account_name]) balance[account_name] = { debit: 0, credit: 0 };
    balance[account_name].debit += Number(debit) || 0;
    balance[account_name].credit += Number(credit) || 0;
  });

  return Object.entries(balance).map(([account, { debit, credit }]) => ({ account, debit, credit }));
}

export async function getCollectionsByDateRange(startISO, endISO) {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("account_name, debit, date")
    .gte("date", startISO)
    .lte("date", endISO)
    .in("account_name", ["Cash", "Bank", "UPI", "Accounts Receivable"]);
  if (error) throw error;

  const sums = { cash: 0, upi: 0, credit: 0 };
  (data || []).forEach((row) => {
    const amount = Number(row.debit) || 0;
    if (row.account_name === "Cash") sums.cash += amount;
    else if (row.account_name === "Bank" || row.account_name === "UPI") sums.upi += amount;
    else if (row.account_name === "Accounts Receivable") sums.credit += amount;
  });
  return sums;
}
