import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { queryKeys } from "@/lib/queryClient";
import { nonSalePatternService } from "@/services/reportService";
import { GST_DEFAULTS } from "../lib/gst";
import { toPgPattern } from "../lib/lines";

export function useGstSettings() {
  const { settings, save, stored } = useShopSettings();
  const gst = useMemo(() => ({ ...GST_DEFAULTS, ...settings.gst }), [settings.gst]);
  return { gst, stored, save: (changes) => save({ gst: { ...settings.gst, ...changes } }) };
}

/** Edits the shared non-sale list; only possible once the table exists. */
export function useNonSalePatterns() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.reports.nonSale });
  const add = useMutation({ mutationFn: (pattern) => nonSalePatternService.add(toPgPattern(pattern)), onSuccess: refresh });
  const remove = useMutation({ mutationFn: nonSalePatternService.remove, onSuccess: refresh });
  return { add: add.mutate, remove: remove.mutate, error: add.error || remove.error, busy: add.isPending || remove.isPending };
}
