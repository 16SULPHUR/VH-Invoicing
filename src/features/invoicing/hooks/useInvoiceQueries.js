import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { invoiceService } from "@/services/invoiceService";
import { getCollectionsByDateRange } from "@/services/accountingService";
import { cacheManager } from "@/lib/offline/cacheManager";
import { isOnline } from "@/lib/offline/network";
import {
  currentFinancialYear,
  endOfDay,
  financialYearRange,
  salesPeriodRange,
  startOfDay,
  toISODate,
} from "@/utils/date";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

const NO_COLLECTIONS = { cash: 0, upi: 0, credit: 0 };

const DAILY_SALES_WINDOW = 7;

export function useRecentInvoices() {
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const { startDate, endDate } = useMemo(() => financialYearRange(financialYear), [financialYear]);

  const query = useQuery({
    queryKey: queryKeys.invoices.financialYear(startDate, endDate),
    queryFn: () => invoiceService.getInvoicesByFinancialYear(startDate, endDate),
  });

  // New invoices are always numbered in today's financial year, whichever year is being viewed.
  const current = financialYearRange(currentFinancialYear());
  const currentYearQuery = useQuery({
    queryKey: queryKeys.invoices.financialYear(current.startDate, current.endDate),
    queryFn: () => invoiceService.getInvoicesByFinancialYear(current.startDate, current.endDate),
  });

  const invoices = useMemo(() => query.data ?? [], [query.data]);
  const nextInvoiceId = useMemo(
    () => invoiceService.getNextInvoiceId(currentYearQuery.data),
    [currentYearQuery.data]
  );

  return { invoices, nextInvoiceId, financialYear, setFinancialYear, ...query };
}

export function useDailySales() {
  return useQueryWithDefault({
    queryKey: queryKeys.invoices.dailySales(DAILY_SALES_WINDOW),
    queryFn: () => invoiceService.getDailySales(DAILY_SALES_WINDOW),
  });
}

export function useSalesSummary() {
  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const range = useMemo(() => salesPeriodRange(period, customRange), [period, customRange]);
  const hasRange = Boolean(range.startDate && range.endDate && !range.startDate.startsWith("T"));

  const summary = useQuery({
    queryKey: queryKeys.invoices.salesSummary(range.startDate, range.endDate),
    queryFn: () => invoiceService.getSalesSummary(range.startDate, range.endDate),
    enabled: hasRange && period !== "custom",
  });

  const today = toISODate();
  const collections = useQueryWithDefault(
    {
      queryKey: queryKeys.accounting.collections(startOfDay(today), endOfDay(today)),
      queryFn: () => getCollectionsByDateRange(startOfDay(today), endOfDay(today)),
    },
    NO_COLLECTIONS
  );

  return {
    period,
    setPeriod,
    customRange,
    setCustomRange,
    summary: summary.data ?? { total: 0, cash: 0, upi: 0, credit: 0, count: 0 },
    refetchSummary: summary.refetch,
    todayCollections: collections.data,
  };
}

/** Catalog of every product, served from IndexedDB first so the till works offline. */
export function useProductCatalog() {
  return useQueryWithDefault({
    queryKey: queryKeys.products.catalog,
    queryFn: async () => {
      const cached = await cacheManager.getCachedProducts();
      if (!isOnline()) return cached;
      await cacheManager.refreshProducts();
      const refreshed = await cacheManager.getCachedProducts();
      return refreshed.length > 0 ? refreshed : cached;
    },
  });
}

export function useCustomerDirectory() {
  return useQueryWithDefault({
    queryKey: queryKeys.customers.all,
    queryFn: async () => {
      const cached = await cacheManager.getCachedCustomers();
      if (!isOnline()) return cached;
      await cacheManager.refreshCustomers();
      const refreshed = await cacheManager.getCachedCustomers();
      return refreshed.length > 0 ? refreshed : cached;
    },
  });
}

/** One place to invalidate everything an invoice write affects. */
export function useInvalidateInvoiceData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [queryKeys.invoices.all, queryKeys.customers.credit, queryKeys.products.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );
}
