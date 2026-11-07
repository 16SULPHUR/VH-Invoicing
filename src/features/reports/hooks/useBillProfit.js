import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { nonSalePatternService, reportService } from "@/services/reportService";
import { buildProductIndex, DEFAULT_NON_SALE, prepareBills } from "../lib/lines";
import { useShowProfit } from "./useShowProfit";

const STALE = 60_000;

/** Profit of a single saved bill, worked out like the reports do. Does nothing while profit is hidden. */
export function useBillProfit() {
  const [show] = useShowProfit();
  const products = useQuery({ queryKey: queryKeys.reports.products, queryFn: reportService.products, staleTime: STALE, enabled: show });
  const patterns = useQuery({ queryKey: queryKeys.reports.nonSale, queryFn: nonSalePatternService.list, staleTime: 5 * STALE, retry: false, enabled: show });

  const index = useMemo(() => (products.data ? buildProductIndex(products.data) : null), [products.data]);
  const nonSalePatterns = patterns.data ?? DEFAULT_NON_SALE;

  const profitOf = useCallback(
    (invoice) => (index ? prepareBills([invoice], { index, nonSalePatterns })[0] : null),
    [index, nonSalePatterns]
  );
  return { show, ready: Boolean(index), profitOf };
}
