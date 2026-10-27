import { supabase, unwrap } from "@/lib/supabase";
import { isMissingTable } from "@/lib/supabaseErrors";
import { applyRange } from "@/features/reports/range/reportRange";
import { readAll } from "./accountingService";

const dayStart = (day) => new Date(`${day}T00:00:00`).toISOString();

export const booksService = {
  async accountBook(accounts, range) {
    const rows = await readAll(() =>
      applyRange(supabase.from("ledger_view").select("*").in("account_name", accounts), range)
        .order("date")
        .order("transaction_id").order("account_name").order("debit")
    );
    let opening = 0;
    if (range?.from) {
      const before = await readAll(() =>
        supabase
          .from("ledger_view")
          .select("debit, credit")
          .in("account_name", accounts)
          .lt("date", dayStart(range.from))
          .order("transaction_id").order("account_name").order("debit")
      );
      opening = before.reduce((sum, row) => sum + (Number(row.debit) || 0) - (Number(row.credit) || 0), 0);
    }
    let running = opening;
    const lines = rows.map((row) => {
      running += (Number(row.debit) || 0) - (Number(row.credit) || 0);
      return { ...row, balance: running };
    });
    return { opening, lines, closing: running };
  },

  async dayBook(range) {
    const rows = await readAll(() =>
      applyRange(supabase.from("ledger_view").select("*"), range).order("date", { ascending: false }).order("transaction_id", { ascending: false }).order("account_name").order("debit")
    );
    const entries = new Map();
    for (const row of rows) {
      const entry = entries.get(row.transaction_id) ?? {
        id: row.transaction_id,
        date: row.date,
        description: row.description,
        reference_table: row.reference_table,
        amount: 0,
        accounts: [],
      };
      entry.amount += Number(row.debit) || 0;
      entry.accounts.push(row.account_name);
      entries.set(row.transaction_id, entry);
    }
    return [...entries.values()];
  },

  async accountBalances(to) {
    const rows = await readAll(() =>
      applyRange(supabase.from("ledger_view").select("account_name, debit, credit"), { to }).order("transaction_id").order("account_name").order("debit")
    );
    const totals = {};
    for (const row of rows) {
      totals[row.account_name] = (totals[row.account_name] ?? 0) + (Number(row.debit) || 0) - (Number(row.credit) || 0);
    }
    return totals;
  },

  async periodTotals(range) {
    const rows = await readAll(() =>
      applyRange(supabase.from("ledger_view").select("account_name, debit, credit"), range).order("transaction_id").order("account_name").order("debit")
    );
    const totals = {};
    for (const row of rows) {
      totals[row.account_name] = (totals[row.account_name] ?? 0) + (Number(row.debit) || 0) - (Number(row.credit) || 0);
    }
    return totals;
  },

  async accounts() {
    return unwrap(await supabase.from("chart_of_accounts").select("id, code, name, type").order("code")) || [];
  },

  async postJournal({ date, description, lines }) {
    return unwrap(await supabase.rpc("post_journal", { p_date: date, p_description: description, p_lines: lines }));
  },

  async deleteJournal(id) {
    return unwrap(await supabase.rpc("delete_journal", { p_id: id }));
  },

  async openingBalances() {
    const rows = await readAll(() =>
      supabase.from("ledger_view").select("transaction_id, description, account_name, debit, credit").eq("reference_table", "journal").like("description", "Opening balance%").order("transaction_id").order("account_name").order("debit")
    );
    return rows;
  },

  async customerAccounts() {
    const [invoices, payments, customers] = await Promise.all([
      readAll(() => supabase.from("invoices").select("date, customerName, customerNumber, total, credit").order("date").order("id")),
      readAll(() => supabase.from("credit_payments").select("customer_name, customer_phone, amount, paid_on").order("paid_on").order("id")).catch((error) => {
        if (isMissingTable(error)) return [];
        throw error;
      }),
      unwrap(await supabase.from("customers").select("*").order("name")) || [],
    ]);
    return { invoices, payments, customers };
  },

  async holdings() {
    try {
      return await readAll(() =>
        supabase.from("balance_entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).order("id")
      );
    } catch (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
  },

  async addHoldings(rows) {
    return unwrap(await supabase.from("balance_entries").insert(rows).select());
  },

  async deleteHolding(entry) {
    const query = supabase.from("balance_entries").delete();
    return unwrap(await (entry.transfer_id ? query.eq("transfer_id", entry.transfer_id) : query.eq("id", entry.id)));
  },
};
