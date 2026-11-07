import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { creditPaymentService } from "@/services/creditPaymentService";
import { customerHistoryService } from "@/services/customerHistoryService";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/supabaseErrors";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";
import { formatRupees } from "@/utils/formatters";
import { customerKey } from "../lib/customerKey";

export function useCustomerInvoices(customer) {
  const key = customer ? customerKey(customer) : null;
  return useQueryWithDefault({
    queryKey: queryKeys.customers.invoices(key),
    queryFn: () => customerHistoryService.listInvoices(customer),
    enabled: Boolean(key),
  });
}

export function useCreditPayments(customer) {
  const key = customer ? customerKey(customer) : null;
  return useQueryWithDefault({
    queryKey: queryKeys.customers.payments(key),
    queryFn: () => creditPaymentService.listForCustomer(customer),
    enabled: Boolean(key),
    retry: false,
  });
}

export function refreshCustomerData(queryClient) {
  return Promise.all(
    [
      queryKeys.customers.credit,
      ["customers", "invoices"],
      ["customers", "payments"],
      queryKeys.invoices.all,
      queryKeys.products.all,
      ["accounting"],
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );
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
        description: isMissingTable(error)
          ? "The payments table isn't set up yet. Run docs/schema/credit_payments.sql in Supabase."
          : error.message,
        variant: "destructive",
      });
    },
    onSettled: () => refreshCustomerData(queryClient),
  });
}

export { isMissingTable };
