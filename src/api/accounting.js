import { supabase } from "../supabaseClient";

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLedger() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getTrialBalance() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("account_name, debit, credit");
  if (error) throw error;

  const balance = {};
  (data || []).forEach(({ account_name, debit, credit }) => {
    const numericDebit = Number(debit) || 0;
    const numericCredit = Number(credit) || 0;
    if (!balance[account_name]) balance[account_name] = { debit: 0, credit: 0 };
    balance[account_name].debit += numericDebit;
    balance[account_name].credit += numericCredit;
  });

  return Object.entries(balance).map(([account, { debit, credit }]) => ({
    account,
    debit,
    credit,
  }));
}

export async function getGSTOutput() {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("*")
    .eq("account_name", "GST Output");
  if (error) throw error;

  const rows = data || [];
  const totalGST = rows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
  return { transactions: rows, totalGST };
}

export async function getCollectionsByDateRange(startISO, endISO) {
  const { data, error } = await supabase
    .from("ledger_view")
    .select("account_name, debit, date")
    .gte("date", startISO)
    .lte("date", endISO)
    .in("account_name", ["Cash", "UPI", "Accounts Receivable"]);
  if (error) throw error;

  const sums = { cash: 0, upi: 0, credit: 0 };
  (data || []).forEach((row) => {
    const amount = Number(row.debit) || 0;
    if (row.account_name === "Cash") sums.cash += amount;
    else if (row.account_name === "UPI") sums.upi += amount;
    else if (row.account_name === "Accounts Receivable") sums.credit += amount;
  });
  return sums;
}


