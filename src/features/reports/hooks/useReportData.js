import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { nonSalePatternService, reportService } from "@/services/reportService";
import { buildProductIndex, DEFAULT_NON_SALE, prepareBills } from "../lib/lines";
import { inRange } from "../range/reportRange";

const STALE = 60_000;

/**
 * Every bill, product and supplier, prepared once and shared by all report tabs.
 * The whole history is a few thousand bills, so ranges are cut in memory.
 */
export function useReportData() {
  const bills = useQuery({ queryKey: queryKeys.reports.bills("all", "all"), queryFn: () => reportService.bills({}), staleTime: STALE });
  const products = useQuery({ queryKey: queryKeys.reports.products, queryFn: reportService.products, staleTime: STALE });
  const suppliers = useQuery({ queryKey: queryKeys.reports.suppliers, queryFn: reportService.suppliers, staleTime: 5 * STALE });
  const patterns = useQuery({ queryKey: queryKeys.reports.nonSale, queryFn: nonSalePatternService.list, staleTime: 5 * STALE, retry: false });

  const nonSalePatterns = patterns.data ?? DEFAULT_NON_SALE;
  const index = useMemo(() => buildProductIndex(products.data, suppliers.data), [products.data, suppliers.data]);
  const all = useMemo(
    () => (bills.data ? prepareBills(bills.data, { index, nonSalePatterns }) : []),
    [bills.data, index, nonSalePatterns]
  );

  return {
    all,
    index,
    nonSalePatterns,
    patternsShared: Array.isArray(patterns.data),
    isLoading: bills.isLoading || products.isLoading,
    error: bills.error || products.error,
    pick: (range) => (range ? all.filter((bill) => inRange(bill.day, range)) : []),
    firstDay: all[0]?.day ?? "",
  };
}
