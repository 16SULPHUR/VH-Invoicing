import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { returnService } from "@/services/returnService";
import { nonSalePatternService } from "@/services/reportService";
import { DEFAULT_NON_SALE } from "@/features/reports/lib/lines";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useToast } from "@/hooks/use-toast";

const returnsKey = (invoice) => ["returns", invoice?.id, invoice?.date];

/** Return notes already made on a bill; disabled for bills that are still queued offline. */
export function useBillReturns(invoice) {
  const synced = Boolean(invoice) && (!invoice._syncStatus || invoice._syncStatus === "synced");
  const query = useQuery({
    queryKey: returnsKey(invoice),
    queryFn: () => returnService.listForInvoice(invoice),
    enabled: synced,
    staleTime: 15_000,
  });
  useQueryErrorToast(query.error, "Couldn't load returns");
  return { notes: query.data ?? [], isLoading: query.isLoading };
}

export function useNonSalePatterns() {
  const query = useQuery({ queryKey: queryKeys.reports.nonSale, queryFn: nonSalePatternService.list, staleTime: 5 * 60_000, retry: false });
  return query.data ?? DEFAULT_NON_SALE;
}

function useRefreshAfterReturn(invoice) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [returnsKey(invoice), queryKeys.invoices.all, queryKeys.products.all, queryKeys.customers.all, queryKeys.books.all, queryKeys.shopTools.records("credit_notes"), ["reports"]]) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

function stockFailureToast(toast, result) {
  if (!result.stock_failures?.length) return;
  toast({
    variant: "destructive",
    title: "Saved, but stock not updated",
    description: `Stock did not change for: ${result.stock_failures.map((failure) => failure.name).join(", ")}. Fix these in Inventory.`,
  });
}

export function useReturnGoods(invoice) {
  const { toast } = useToast();
  const refresh = useRefreshAfterReturn(invoice);
  return useMutation({
    mutationFn: (input) => returnService.returnGoods(invoice, input),
    onSuccess: (result) => {
      stockFailureToast(toast, result);
      refresh();
    },
    onError: (error) => toast({ variant: "destructive", title: "Couldn't save the return", description: error.message }),
  });
}

export function useEditReturn(invoice) {
  const { toast } = useToast();
  const refresh = useRefreshAfterReturn(invoice);
  return useMutation({
    mutationFn: (input) => returnService.editReturn(input.note, input),
    onSuccess: refresh,
    onError: (error) => toast({ variant: "destructive", title: "Couldn't change the return", description: error.message }),
  });
}

export function useCancelReturn(invoice) {
  const { toast } = useToast();
  const refresh = useRefreshAfterReturn(invoice);
  return useMutation({
    mutationFn: (note) => returnService.cancelReturn(note),
    onSuccess: (result) => {
      stockFailureToast(toast, result);
      refresh();
    },
    onError: (error) => toast({ variant: "destructive", title: "Couldn't delete the return", description: error.message }),
  });
}
