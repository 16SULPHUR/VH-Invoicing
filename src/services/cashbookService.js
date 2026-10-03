import { supabase, unwrap } from "@/lib/supabase";

export const DEFAULT_CASH_ACCOUNTS = ["HOME", "SHOP"];

const RECONCILIATION_LOOKBACK_DAYS = 365;

function daysAgoISODate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export const cashbookService = {
  async listAccounts() {
    return (
      unwrap(await supabase.from("cash_accounts").select("id,name,is_active").order("name")) || []
    );
  },

  async createAccounts(names) {
    return unwrap(
      await supabase
        .from("cash_accounts")
        .insert(names.map((name) => ({ name: name.toUpperCase() })))
        .select()
    );
  },

  /** Returns the existing accounts plus any default accounts that were missing. */
  async ensureDefaultAccounts() {
    const accounts = await this.listAccounts();
    const missing = DEFAULT_CASH_ACCOUNTS.filter(
      (name) => !accounts.some((account) => account.name.toUpperCase() === name)
    );
    if (missing.length === 0) return accounts;
    const inserted = await this.createAccounts(missing);
    return [...accounts, ...(inserted || [])];
  },

  async listReconciliations() {
    return (
      unwrap(
        await supabase
          .from("cash_reconciliations")
          .select("id,account_id,as_of_date,balance,note,author,created_at")
          .gte("as_of_date", daysAgoISODate(RECONCILIATION_LOOKBACK_DAYS))
          .order("as_of_date")
          .order("created_at")
      ) || []
    );
  },

  async listTransactions(since) {
    return (
      unwrap(
        await supabase
          .from("cash_transactions")
          .select("id,account_id,txn_date,amount,type,description,author,created_at")
          .gte("txn_date", since)
          .order("txn_date")
          .order("created_at")
      ) || []
    );
  },

  async addTransaction(transaction) {
    return unwrap(await supabase.from("cash_transactions").insert(transaction));
  },

  async addTransactions(transactions) {
    if (transactions.length === 0) return null;
    return unwrap(await supabase.from("cash_transactions").insert(transactions));
  },

  async deleteTransactions(ids) {
    if (ids.length === 0) return null;
    return unwrap(await supabase.from("cash_transactions").delete().in("id", ids));
  },

  async deleteReconciliation(id) {
    return unwrap(await supabase.from("cash_reconciliations").delete().eq("id", id));
  },

  /** Replaces any earlier handover for the same day, then writes the new one. */
  async saveHandover({ homeId, shopId, date, brought, left, note, author, replaceIds, nextDate }) {
    await this.deleteTransactions(replaceIds);
    if (brought > 0) {
      await this.addTransaction({
        account_id: homeId,
        txn_date: date,
        amount: brought,
        type: "inflow",
        description: `Handover ${date}`,
        author,
      });
    }
    return this.upsertReconciliations([
      { account_id: shopId, as_of_date: nextDate, balance: left, note, author },
    ]);
  },

  async upsertReconciliations(snapshots) {
    if (snapshots.length === 0) return null;
    return unwrap(
      await supabase
        .from("cash_reconciliations")
        .upsert(snapshots, { onConflict: "account_id,as_of_date" })
    );
  },

  /** Cash taken against old credit bills on a day, or null before credit_payments exists. */
  async cashCollectedOn(isoDate) {
    const { data, error } = await supabase
      .from("credit_payments")
      .select("amount")
      .eq("method", "cash")
      .eq("paid_on", isoDate);
    if (error) {
      if (["42P01", "PGRST205"].includes(error.code)) return null;
      throw error;
    }
    return (data || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  },

  async parseText(text) {
    const { data, error } = await supabase.functions.invoke("cashbook-parser", { body: { text } });
    if (error) throw error;
    return data;
  },

  async loadAll() {
    const accounts = await this.ensureDefaultAccounts();
    const reconciliations = await this.listReconciliations();
    const transactions = await this.listTransactions(daysAgoISODate(RECONCILIATION_LOOKBACK_DAYS));
    return { accounts, reconciliations, transactions };
  },
};
