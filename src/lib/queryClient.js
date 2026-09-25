import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) return false;
        // PostgREST auth/RLS failures carry a code, not an HTTP status.
        if (error?.code === "PGRST301" || error?.code === "42501") return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// Namespaced so a feature can invalidate its own slice without guessing key shapes.
export const queryKeys = {
  invoices: {
    all: ["invoices"],
    financialYear: (start, end) => ["invoices", "financial-year", start, end],
    byDate: (date) => ["invoices", "by-date", date],
    dailySales: (days) => ["invoices", "daily-sales", days],
    salesSummary: (start, end) => ["invoices", "sales-summary", start, end],
  },
  products: {
    all: ["products"],
    full: ["products", "full"],
    catalog: ["products", "catalog"],
    detail: (id) => ["products", id],
  },
  suppliers: { all: ["suppliers"] },
  customers: {
    all: ["customers"],
    credit: ["customers", "credit"],
    invoices: (key) => ["customers", "invoices", key],
    payments: (key) => ["customers", "payments", key],
  },
  scannedProducts: { all: ["scanned-products"] },
  cashbook: {
    accounts: ["cashbook", "accounts"],
    transactions: ["cashbook", "transactions"],
    reconciliations: ["cashbook", "reconciliations"],
    closeDay: (date) => ["cashbook", "close-day", date],
  },
  accounting: {
    transactions: ["accounting", "transactions"],
    ledger: ["accounting", "ledger"],
    trialBalance: ["accounting", "trial-balance"],
    gst: ["accounting", "gst"],
    collections: (start, end) => ["accounting", "collections", start, end],
  },
};
