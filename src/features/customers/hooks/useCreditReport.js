import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { invoiceService } from "@/services/invoiceService";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

/** Last 10 digits of the phone, else the trimmed lowercase name. */
export function customerKey(invoice) {
  const digits = String(invoice.customerNumber ?? "").replace(/\D/g, "").slice(-10);
  if (digits.length === 10) return `phone:${digits}`;
  return `name:${String(invoice.customerName ?? "").trim().toLowerCase()}`;
}

/** Credit invoices grouped by customer, showing the most recent name used. */
function groupByCustomer(invoices) {
  const groups = new Map();
  const newestFirst = [...invoices].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  for (const invoice of newestFirst) {
    const key = customerKey(invoice);
    const group = groups.get(key) ?? {
      key,
      customerName: String(invoice.customerName ?? "").trim() || "Unnamed",
      customerNumber: invoice.customerNumber ?? "",
      totalCredit: 0,
      invoices: [],
    };
    group.invoices.push(invoice);
    group.totalCredit += Number(invoice.credit) || 0;
    groups.set(key, group);
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
    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(needle) ||
        String(customer.customerNumber).includes(needle)
    );
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
