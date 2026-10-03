import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { cashbookService } from "@/services/cashbookService";
import { invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { localDayBounds, localISODate } from "@/utils/date";
import { toNumber } from "@/utils/formatters";
import { balanceAsOf, shiftISODate } from "../balances";
import { closeNote, isHandover } from "../history";
import { useEnteredBy } from "./useEnteredBy";

const BIG_GAP = 500;

export function useHandover({
  transactions,
  reconciliations,
  accountIdByName,
  invalidate,
  enabled,
}) {
  const { toast } = useToast();
  const [counted, setCounted] = useState("");
  const [taken, setTaken] = useState("");
  const [by, setBy] = useEnteredBy();
  const [armed, setArmed] = useState(false);

  const today = localISODate();
  const tomorrow = shiftISODate(today, 1);
  const homeId = accountIdByName("HOME");
  const shopId = accountIdByName("SHOP");
  const data = { transactions, reconciliations };

  const takings = useQuery({
    queryKey: queryKeys.cashbook.closeDay(today),
    queryFn: async () => {
      const { start, end } = localDayBounds();
      const [sales, collected] = await Promise.all([
        invoiceService.getSalesSummary(start, end),
        cashbookService.cashCollectedOn(today),
      ]);
      return { billCash: sales.cash, billCount: sales.count, collected };
    },
    enabled,
    staleTime: 0,
  });

  const earlier = transactions.filter(
    (row) => row.account_id === homeId && row.txn_date === today && isHandover(row)
  );
  const closedToday = reconciliations.find(
    (row) => row.account_id === shopId && row.as_of_date === tomorrow
  );

  const shopOpening = shopId ? balanceAsOf(data, shopId, today) : 0;
  const homeBefore =
    (homeId ? balanceAsOf(data, homeId, today) : 0) -
    earlier.reduce((sum, row) => sum + Number(row.amount), 0);
  const billCash = takings.data?.billCash ?? 0;
  const collected = takings.data?.collected ?? 0;
  const expected = shopOpening + billCash + collected;

  const hasCount = counted.trim() !== "";
  const countedAmount = toNumber(counted);
  const takenAmount = toNumber(taken);
  const difference = hasCount ? countedAmount - expected : 0;
  const shopLeft = countedAmount - takenAmount;
  const homeAfter = homeBefore + takenAmount;

  const problem = !hasCount
    ? null
    : takenAmount < 0
      ? "Cash taken home can't be negative."
      : takenAmount > countedAmount
        ? "You can't take home more than was counted."
        : !by.trim()
          ? "Enter who is closing."
          : null;
  const bigGap = hasCount && Math.abs(difference) >= BIG_GAP;

  const save = useMutation({
    mutationFn: () => {
      if (!homeId || !shopId) throw new Error("The cashbook needs HOME and SHOP accounts");
      return cashbookService.saveHandover({
        homeId,
        shopId,
        date: today,
        nextDate: tomorrow,
        brought: takenAmount,
        left: shopLeft,
        author: by.trim(),
        replaceIds: earlier.map((row) => row.id),
        note: closeNote({ date: today, expected, counted: countedAmount, taken: takenAmount }),
      });
    },
    onSuccess: () => {
      invalidate();
      setCounted("");
      setTaken("");
      setArmed(false);
      toast({ title: "Day closed", description: "Shop cash left is tomorrow's opening balance." });
    },
    onError: (error) =>
      toast({
        title: "Could not close the day",
        description: error.message,
        variant: "destructive",
      }),
  });

  const submit = (onDone) => {
    if (bigGap && !armed) {
      setArmed(true);
      return;
    }
    save.mutate(undefined, { onSuccess: onDone });
  };

  return {
    today,
    hasAccounts: Boolean(homeId && shopId),
    isLoading: takings.isLoading,
    error: takings.error,
    closedToday,
    shopOpening,
    billCash,
    billCount: takings.data?.billCount ?? 0,
    collected,
    collectionsTracked: takings.data?.collected !== null,
    expected,
    counted,
    setCounted: (value) => {
      setCounted(value);
      setArmed(false);
    },
    taken,
    setTaken,
    by,
    setBy,
    hasCount,
    difference,
    shopLeft,
    homeBefore,
    homeAfter,
    problem,
    bigGap,
    armed,
    canSave: hasCount && !problem && !takings.isLoading && !save.isPending,
    submit,
    isSaving: save.isPending,
  };
}
