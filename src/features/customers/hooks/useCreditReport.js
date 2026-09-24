import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { invoiceService } from "@/services/invoiceService";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

/** Credit invoices grouped by customer, with a per-customer outstanding total. */
function groupByCustomer(invoices) {
  const groups = new Map();

  for (const invoice of invoices) {
    const name = String(invoice.customerName ?? "").trim() || "Unnamed";
    const group = groups.get(name) ?? { customerName: name, totalCredit: 0, invoices: [] };
    group.invoices.push(invoice);
    group.totalCredit += Number(invoice.credit) || 0;
    groups.set(name, group);
  }

  return Array.from(groups.values());
}

export function useCreditReport() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: invoices,
    isLoading,
    error,
  } = useQueryWithDefault({
    queryKey: queryKeys.customers.credit,
    queryFn: () => invoiceService.getCreditInvoices(),
  });
  useQueryErrorToast(error, "Failed to fetch credit data");

  const customers = useMemo(() => groupByCustomer(invoices), [invoices]);

  const filtered = useMemo(() => {
    const needle = searchTerm.toLowerCase();
    return customers.filter((customer) => customer.customerName.toLowerCase().includes(needle));
  }, [customers, searchTerm]);

  const summary = useMemo(
    () => ({
      totalCredit: invoices.reduce((sum, invoice) => sum + (Number(invoice.credit) || 0), 0),
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
    }),
    [invoices, customers]
  );

  return {
    customers: filtered,
    summary,
    isLoading,
    searchTerm,
    setSearchTerm,
    // Invoice edits here also move stock and feed the till and reports.
    refresh: () =>
      Promise.all(
        [
          queryKeys.customers.credit,
          queryKeys.invoices.all,
          queryKeys.products.all,
          ["accounting"],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      ),
  };
}
