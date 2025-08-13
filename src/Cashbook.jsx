import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Upload, Wallet, DownloadCloud, DatabaseZap } from "lucide-react";
import { parseCashbookText } from "./utils/cashbookParser";

const DEFAULT_ACCOUNTS = [
  { name: "HOME" },
  { name: "SHOP" },
];

const accountDisplayName = (name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const Cashbook = () => {
  const [isBusy, setIsBusy] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [quickAccount, setQuickAccount] = useState("HOME");
  const [quickType, setQuickType] = useState("inflow");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState(null);

  const accountNameToId = useMemo(() => {
    const map = new Map();
    accounts.forEach((a) => map.set(a.name.toUpperCase(), a.id));
    return map;
  }, [accounts]);

  const balances = useMemo(() => {
    // Compute running balance using reconciliations as baselines per account, then apply transactions
    const result = {};
    const groupedTxns = new Map();
    transactions.forEach((t) => {
      const key = `${t.account_id}`;
      if (!groupedTxns.has(key)) groupedTxns.set(key, []);
      groupedTxns.get(key).push(t);
    });
    const groupedSnaps = new Map();
    reconciliations.forEach((r) => {
      const key = `${r.account_id}`;
      if (!groupedSnaps.has(key)) groupedSnaps.set(key, []);
      groupedSnaps.get(key).push(r);
    });

    accounts.forEach((a) => {
      const key = `${a.id}`;
      const snaps = (groupedSnaps.get(key) || []).sort((x, y) => x.as_of_date.localeCompare(y.as_of_date));
      const txns = (groupedTxns.get(key) || []).sort((x, y) => x.txn_date.localeCompare(y.txn_date) || x.created_at.localeCompare(y.created_at));
      let balance = 0;
      if (snaps.length > 0) {
        balance = Number(snaps[snaps.length - 1].balance || 0);
      }
      txns.forEach((t) => {
        // apply only txns after the latest snapshot
        const latestSnapDate = snaps.length > 0 ? snaps[snaps.length - 1].as_of_date : null;
        if (!latestSnapDate || t.txn_date >= latestSnapDate) {
          balance += Number(t.amount || 0);
        }
      });
      result[a.id] = balance;
    });
    return result;
  }, [accounts, transactions, reconciliations]);

  const loadData = async () => {
    setIsBusy(true);
    setError("");
    try {
      // Accounts
      const { data: accData, error: accErr } = await supabase
        .from("cash_accounts")
        .select("id,name,is_active")
        .order("name");
      if (accErr) throw accErr;
      let accs = accData || [];
      // Ensure default accounts exist
      const missing = DEFAULT_ACCOUNTS.filter(
        (d) => !accs.some((a) => a.name.toUpperCase() === d.name.toUpperCase())
      );
      if (missing.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from("cash_accounts")
          .insert(missing.map((m) => ({ name: m.name })))
          .select();
        if (insertErr) throw insertErr;
        accs = [...accs, ...(inserted || [])];
      }
      setAccounts(accs);

      // Reconciliations (last 365 days)
      const sinceRec = new Date();
      sinceRec.setDate(sinceRec.getDate() - 365);
      const sinceRecStr = sinceRec.toISOString().slice(0, 10);
      const { data: recData, error: recErr } = await supabase
        .from("cash_reconciliations")
        .select("id,account_id,as_of_date,balance,note,author,created_at")
        .gte("as_of_date", sinceRecStr)
        .order("as_of_date")
        .order("created_at");
      if (recErr) throw recErr;
      setReconciliations(recData || []);

      // Determine a conservative since date for transactions: the earliest of the latest snapshots per account
      let globalSinceStr;
      if (recData && recData.length > 0) {
        const latestByAccount = new Map();
        recData.forEach((r) => {
          const key = `${r.account_id}`;
          const prev = latestByAccount.get(key);
          if (!prev || r.as_of_date > prev.as_of_date) {
            latestByAccount.set(key, r);
          }
        });
        const latestDates = Array.from(latestByAccount.values()).map((r) => r.as_of_date);
        const earliestOfLatest = latestDates.sort()[0];
        globalSinceStr = earliestOfLatest;
      }
      if (!globalSinceStr) {
        const since = new Date();
        since.setDate(since.getDate() - 180);
        globalSinceStr = since.toISOString().slice(0, 10);
      }

      // Transactions since globalSinceStr
      const { data: txnData, error: txnErr } = await supabase
        .from("cash_transactions")
        .select("id,account_id,txn_date,amount,type,description,author,created_at")
        .gte("txn_date", globalSinceStr)
        .order("txn_date")
        .order("created_at");
      if (txnErr) throw txnErr;
      setTransactions(txnData || []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load cashbook data");
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const accountIdByName = (name) => {
    const id = accountNameToId.get(name.toUpperCase());
    return id || null;
  };

  const handleQuickAdd = async () => {
    setError("");
    setSuccess("");
    const accountId = accountIdByName(quickAccount);
    if (!accountId) {
      setError("Account not found");
      return;
    }
    const amountNumber = Number(quickAmount);
    if (!amountNumber || Number.isNaN(amountNumber)) {
      setError("Enter a valid amount");
      return;
    }
    const normalizedAmount = ["outflow", "bank_deposit"].includes(quickType)
      ? -Math.abs(amountNumber)
      : Math.abs(amountNumber);

    setIsBusy(true);
    try {
      const { error: insErr } = await supabase.from("cash_transactions").insert({
        account_id: accountId,
        txn_date: quickDate,
        amount: normalizedAmount,
        type: quickType,
        description: quickNote || null,
      });
      if (insErr) throw insErr;
      setQuickAmount("");
      setQuickNote("");
      await loadData();
      setSuccess("Entry saved");
    } catch (e) {
      setError(e?.message || "Failed to save entry");
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkPreview = async () => {
    setError("");
    setSuccess("");
    const text = bulkText?.trim();
    if (!text) return;

    // Try server-side parser via Edge Function if available, else fallback
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("cashbook-parser", {
        body: { text },
      });
      if (fnErr) throw fnErr;
      setBulkPreview(data);
    } catch (e) {
      // Fallback to client parser
      try {
        const parsed = parseCashbookText(text);
        setBulkPreview(parsed);
      } catch (err) {
        setError("Parser error: " + (err?.message || "unknown"));
      }
    }
  };

  const handleBulkImport = async () => {
    if (!bulkPreview) return;
    setIsBusy(true);
    setError("");
    setSuccess("");
    try {
      const toTxn = [];
      const toSnap = [];
      // Map account names to ids; create missing accounts on the fly
      const ensureAccount = async (name) => {
        const upper = name.toUpperCase();
        let id = accountNameToId.get(upper);
        if (id) return id;
        const { data: inserted, error: insErr } = await supabase
          .from("cash_accounts")
          .insert({ name: upper })
          .select("id")
          .single();
        if (insErr) throw insErr;
        setAccounts((prev) => [...prev, { id: inserted.id, name: upper }]);
        return inserted.id;
      };

      for (const t of bulkPreview.transactions || []) {
        const accountId = await ensureAccount(t.account);
        toTxn.push({
          account_id: accountId,
          txn_date: t.txn_date,
          amount: t.amount,
          type: t.type || (t.amount >= 0 ? "inflow" : "outflow"),
          description: t.note || null,
          author: t.author || null,
        });
      }
      for (const s of bulkPreview.snapshots || []) {
        const accountId = await ensureAccount(s.account);
        toSnap.push({
          account_id: accountId,
          as_of_date: s.as_of_date,
          balance: s.balance,
          note: s.note || null,
          author: s.author || null,
        });
      }

      if (toTxn.length > 0) {
        const { error: txnErr } = await supabase.from("cash_transactions").insert(toTxn);
        if (txnErr) throw txnErr;
      }
      if (toSnap.length > 0) {
        // Upsert by (account_id, as_of_date)
        const { error: snapErr } = await supabase
          .from("cash_reconciliations")
          .upsert(toSnap, { onConflict: "account_id,as_of_date" });
        if (snapErr) throw snapErr;
      }

      await loadData();
      setSuccess("Imported successfully");
      setBulkPreview(null);
      setBulkText("");
    } catch (e) {
      setError(e?.message || "Bulk import failed");
    } finally {
      setIsBusy(false);
    }
  };

  const formatINR = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xl md:text-2xl flex items-center gap-2 text-sky-500">
          <Wallet className="w-6 h-6" /> Cashbook
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white text-black" onClick={loadData} disabled={isBusy}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 text-sm rounded bg-red-900/50 border border-red-700 text-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-3 p-2 text-sm rounded bg-green-900/50 border border-green-700 text-green-200">{success}</div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {accounts.map((a) => (
          <div key={a.id} className="rounded border border-slate-700 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">{accountDisplayName(a.name)}</div>
            <div className="text-2xl font-bold text-sky-400">₹ {formatINR(balances[a.id] || 0)}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
          <div className="font-semibold text-sky-400 mb-3 flex items-center gap-2"><DatabaseZap className="w-4 h-4"/> Quick entry</div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <Label className="text-xs">Account</Label>
              <select value={quickAccount} onChange={(e) => setQuickAccount(e.target.value)} className="w-full bg-transparent border border-slate-700 rounded px-2 py-1">
                {accounts.map((a) => (
                  <option key={a.id} value={a.name} className="bg-slate-900">
                    {accountDisplayName(a.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <Label className="text-xs">Type</Label>
              <select value={quickType} onChange={(e) => setQuickType(e.target.value)} className="w-full bg-transparent border border-slate-700 rounded px-2 py-1">
                <option value="inflow" className="bg-slate-900">Cash In</option>
                <option value="outflow" className="bg-slate-900">Cash Out</option>
                <option value="bank_deposit" className="bg-slate-900">Bank Deposit</option>
                <option value="correction" className="bg-slate-900">Correction</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Amount (₹)</Label>
              <Input type="number" placeholder="0" value={quickAmount} onChange={(e) => setQuickAmount(e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <Label className="text-xs">Note</Label>
            <Input type="text" placeholder="Optional" value={quickNote} onChange={(e) => setQuickNote(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleQuickAdd} disabled={isBusy || !quickAmount} className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4" /> Save Entry
            </Button>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
          <div className="font-semibold text-sky-400 mb-3 flex items-center gap-2"><DownloadCloud className="w-4 h-4"/> Paste chat to import</div>
          <textarea
            className="w-full h-40 bg-transparent border border-slate-700 rounded p-2 text-sm"
            placeholder="Paste your cash balance chat here..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="bg-white text-black" onClick={handleBulkPreview} disabled={!bulkText || isBusy}>
              Preview
            </Button>
            <Button onClick={handleBulkImport} disabled={!bulkPreview || isBusy} className="bg-sky-600 hover:bg-sky-700">
              Import
            </Button>
          </div>
          {bulkPreview && (
            <div className="mt-3 text-xs text-slate-300">
              <div>Transactions: {bulkPreview?.transactions?.length || 0}</div>
              <div>Snapshots: {bulkPreview?.snapshots?.length || 0}</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
        <div className="font-semibold text-sky-400 mb-3">Recent transactions (last 120 days)</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Account</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Note</th>
                <th className="text-left p-2">Author</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-slate-400">No entries yet</td>
                </tr>
              )}
              {transactions
                .slice()
                .sort((a, b) => (a.txn_date < b.txn_date ? 1 : a.txn_date > b.txn_date ? -1 : a.created_at < b.created_at ? 1 : -1))
                .map((t) => {
                  const acc = accounts.find((a) => a.id === t.account_id);
                  return (
                    <tr key={t.id} className="border-b border-slate-800/60">
                      <td className="p-2 whitespace-nowrap">{t.txn_date}</td>
                      <td className="p-2 whitespace-nowrap">{acc ? accountDisplayName(acc.name) : t.account_id}</td>
                      <td className={`p-2 text-right whitespace-nowrap ${Number(t.amount) < 0 ? "text-red-300" : "text-green-300"}`}>{Number(t.amount) < 0 ? "-" : "+"}₹ {formatINR(Math.abs(t.amount))}</td>
                      <td className="p-2 whitespace-nowrap uppercase">{t.type}</td>
                      <td className="p-2">{t.description || "-"}</td>
                      <td className="p-2">{t.author || "-"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Cashbook;


