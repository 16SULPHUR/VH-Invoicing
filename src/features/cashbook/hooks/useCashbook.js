import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { cashbookService } from "@/services/cashbookService";
import { parseCashbookText } from "@/utils/cashbookParser";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { computeBalances, normalizeAmount } from "../balances";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

const EMPTY_CASHBOOK = { accounts: [], reconciliations: [], transactions: [] };

export function useCashbook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, refetch, error } = useQueryWithDefault(
    {
      queryKey: queryKeys.cashbook.transactions,
      queryFn: () => cashbookService.loadAll(),
    },
    EMPTY_CASHBOOK
  );
  useQueryErrorToast(error, "Failed to load cashbook data");

  const balances = useMemo(() => computeBalances(data), [data]);

  const accountIdByName = useCallback(
    (name) =>
      data.accounts.find((account) => account.name.toUpperCase() === name.toUpperCase())?.id,
    [data.accounts]
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.cashbook.transactions });

  const addEntry = useMutation({
    mutationFn: async ({ account, date, type, amount, note }) => {
      const accountId = accountIdByName(account);
      if (!accountId) throw new Error(`Account "${account}" not found`);

      const numericAmount = Number(amount);
      if (!numericAmount || Number.isNaN(numericAmount)) {
        throw new Error("Enter a valid amount");
      }

      return cashbookService.addTransaction({
        account_id: accountId,
        txn_date: date,
        amount: normalizeAmount(numericAmount, type),
        type,
        description: note || null,
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Entry saved" });
    },
    onError: (error) =>
      toast({ title: "Failed to save entry", description: error.message, variant: "destructive" }),
  });

  return { ...data, balances, isLoading, refetch, addEntry, accountIdByName, invalidate };
}

/** Preview-then-import flow for pasted chat logs. */
export function useCashbookImport({ accounts, accountIdByName, invalidate }) {
  const { toast } = useToast();
  const [preview, setPreview] = useState(null);

  const buildPreview = useMutation({
    // The edge function is optional; fall back to the bundled parser.
    mutationFn: async (text) => {
      try {
        return await cashbookService.parseText(text);
      } catch {
        return parseCashbookText(text);
      }
    },
    onSuccess: setPreview,
    onError: (error) =>
      toast({ title: "Parser error", description: error.message, variant: "destructive" }),
  });

  const runImport = useMutation({
    mutationFn: async () => {
      if (!preview) return;

      const createdAccounts = new Map(
        accounts.map((account) => [account.name.toUpperCase(), account.id])
      );

      const ensureAccount = async (name) => {
        const upper = name.toUpperCase();
        const known = createdAccounts.get(upper) ?? accountIdByName(upper);
        if (known) return known;

        const [inserted] = await cashbookService.createAccounts([upper]);
        createdAccounts.set(upper, inserted.id);
        return inserted.id;
      };

      const transactions = [];
      for (const row of preview.transactions ?? []) {
        transactions.push({
          account_id: await ensureAccount(row.account),
          txn_date: row.txn_date,
          amount: row.amount,
          type: row.type || (row.amount >= 0 ? "inflow" : "outflow"),
          description: row.note || null,
          author: row.author || null,
        });
      }

      const snapshots = [];
      for (const row of preview.snapshots ?? []) {
        snapshots.push({
          account_id: await ensureAccount(row.account),
          as_of_date: row.as_of_date,
          balance: row.balance,
          note: row.note || null,
          author: row.author || null,
        });
      }

      await cashbookService.addTransactions(transactions);
      await cashbookService.upsertReconciliations(snapshots);
    },
    onSuccess: () => {
      invalidate();
      setPreview(null);
      toast({ title: "Imported successfully" });
    },
    onError: (error) =>
      toast({ title: "Bulk import failed", description: error.message, variant: "destructive" }),
  });

  return { preview, setPreview, buildPreview, runImport };
}
