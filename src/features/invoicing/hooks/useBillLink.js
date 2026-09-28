import { useQuery } from "@tanstack/react-query";
import { billLinkService } from "@/services/billLinkService";

export function useBillLink(invoice, origin) {
  const { data } = useQuery({
    queryKey: ["bill-link", invoice?.date, invoice?.share_code ?? null, invoice?._syncStatus ?? null, origin ?? null],
    queryFn: () => billLinkService.linkFor(invoice, origin),
    enabled: Boolean(invoice?.date),
    staleTime: Infinity,
    retry: false,
  });
  return data ?? null;
}
