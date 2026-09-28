import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { cashbookService } from "@/services/cashbookService";
import { invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { localDayBounds, localISODate } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";

export const DRAWER_ACCOUNT = "SHOP";

/**
 * Expected drawer cash = the SHOP balance (last count plus today's entries)
 * + cash from today's bills + cash collected on old credit bills today.
 * Saving records the count as tomorrow's opening balance for SHOP.
 */
export function useCloseDay({ balances, accountIdByName, invalidate, enabled }) {
  const { toast } = useToast();
  const [counted, setCounted] = useState("");

  const today = localISODate();
  const drawerId = accountIdByName(DRAWER_ACCOUNT);

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

  const opening = drawerId ? Number(balances[drawerId]) || 0 : 0;
  const billCash = takings.data?.billCash ?? 0;
  const collected = takings.data?.collected ?? 0;
  const expected = opening + billCash + collected;
  const hasCount = counted.trim() !== "";
  const difference = hasCount ? toNumber(counted) - expected : 0;

  const save = useMutation({
    mutationFn: () => {
      if (!drawerId) throw new Error(`No ${DRAWER_ACCOUNT} account in the cashbook`);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return cashbookService.upsertReconciliations([
        {
          account_id: drawerId,
          as_of_date: localISODate(tomorrow),
          balance: toNumber(counted),
          note: `Closed ${today}: expected ${formatRupees(expected)}, counted ${formatRupees(
            toNumber(counted)
          )}`,
        },
      ]);
    },
    onSuccess: () => {
      invalidate();
      setCounted("");
      toast({ title: "Day closed", description: "Counted cash is tomorrow's opening balance." });
    },
    onError: (error) =>
      toast({
        title: "Could not close the day",
        description: error.message,
        variant: "destructive",
      }),
  });

  return {
    today,
    hasDrawer: Boolean(drawerId),
    isLoading: takings.isLoading,
    error: takings.error,
    opening,
    billCash,
    billCount: takings.data?.billCount ?? 0,
    collected,
    collectionsTracked: takings.data?.collected !== null,
    expected,
    counted,
    setCounted,
    hasCount,
    difference,
    save,
  };
}
