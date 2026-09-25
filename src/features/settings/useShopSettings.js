import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BUSINESS } from "@/config/business";
import { queryKeys } from "@/lib/queryClient";
import { shopSettingsService } from "@/services/shopSettingsService";

export const DEFAULT_PRODUCT_FIELDS = [
  { key: "fabric", label: "Fabric" },
  { key: "colour", label: "Colour" },
  { key: "size", label: "Size" },
  { key: "design_no", label: "Design no." },
  { key: "work", label: "Work type" },
];

export const SHOP_DEFAULTS = {
  shop_name: BUSINESS.displayName,
  tagline: "Drape Yourself in Luxury",
  phone: "",
  whatsapp: "",
  upi_id: BUSINESS.upiId,
  cost_code_word: "",
  product_fields: DEFAULT_PRODUCT_FIELDS,
  wa_channel: "",
};

export const SHOP_FIELDS = [
  { key: "shop_name", label: "Shop name" },
  { key: "tagline", label: "Tagline" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/91…" },
  { key: "upi_id", label: "UPI ID" },
  { key: "cost_code_word", label: "Cost code word", placeholder: "10 different letters" },
];

/**
 * Shop-wide values (name, tagline, contact, UPI, cost code word, extra product fields),
 * shared by stickers and messages. Works from this browser until the table exists.
 */
export function useShopSettings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.shopSettings,
    queryFn: () => shopSettingsService.load(),
    placeholderData: () => ({ values: shopSettingsService.readLocal(), stored: "device" }),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (changes) => shopSettingsService.save(changes),
    onMutate: (changes) => {
      queryClient.setQueryData(queryKeys.shopSettings, (previous) => ({
        stored: previous?.stored ?? "device",
        values: { ...previous?.values, ...changes },
      }));
    },
    onSuccess: (result) => queryClient.setQueryData(queryKeys.shopSettings, result),
  });

  const values = query.data?.values;
  const settings = useMemo(() => {
    const merged = { ...SHOP_DEFAULTS, ...values };
    if (!Array.isArray(merged.product_fields)) merged.product_fields = DEFAULT_PRODUCT_FIELDS;
    return merged;
  }, [values]);

  return {
    settings,
    save: mutation.mutate,
    isSaving: mutation.isPending,
    stored: query.isPlaceholderData ? null : query.data?.stored,
    isLoading: query.isLoading,
  };
}
