import { useEffect } from "react";
import { setAppBadge } from "@/lib/appBadge";
import { useCreditReport } from "@/features/customers/hooks/useCreditReport";

/** Shows how many customers owe money on the installed app's icon. */
export function useDuesBadge() {
  const { summary, isLoading } = useCreditReport();

  useEffect(() => {
    if (!isLoading) setAppBadge(summary.totalCustomers);
  }, [isLoading, summary.totalCustomers]);
}
