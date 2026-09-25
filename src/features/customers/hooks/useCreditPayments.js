import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { creditPaymentService } from "@/services/creditPaymentService";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";
import { formatRupees } from "@/utils/formatters";

export function useCreditPayments(customerName) {
  const query = useQueryWithDefault({
    queryKey: queryKeys.customers.payments(customerName),
    queryFn: () => creditPaymentService.listForCustomer(customerName),
    enabled: Boolean(customerName),
  });
  useQueryErrorToast(query.error, "Failed to load payment history");
  return query;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payment) => creditPaymentService.record(payment),
    onSuccess: (_, { allocations, method }) => {
      const total = allocations.reduce((sum, { amount }) => sum + amount, 0);
      toast({ title: `Recorded ${formatRupees(total)} ${method === "upi" ? "UPI" : "cash"}` });
    },
    onError: (error) => {
      toast({
        title: "Payment not recorded",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () =>
      Promise.all(
        [queryKeys.customers.credit, ["customers", "payments"], queryKeys.invoices.all, ["accounting"]].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey })
        )
      ),
  });
}
