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

export const DEFAULT_BILL_TERMS = [
  "Goods once sold will not be taken back.",
  "Exchange timing is 4:00 PM to 6:00 PM.",
  "No guarantee for colour and zari quality.",
  "Goods should be returned within 4 days.",
  "Subject to Surat jurisdiction only.",
];

export const DEFAULT_JOB_KINDS = [
  { value: "fall_pico", label: "Fall-pico", days: 2 },
  { value: "blouse", label: "Blouse stitching", days: 7 },
  { value: "alteration", label: "Alteration", days: 3 },
  { value: "other", label: "Other", days: 3 },
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
  address: "Shop no. 09, Sentosa Enclave, Near Ramipark Soc., Dindoli, Surat, Gujarat 394210",
  bill_contacts: ["81601 85875", "79900 57097", "@varietyheaven.in"],
  bill_terms: DEFAULT_BILL_TERMS,
  logo_url: "new-logo.png",
  signature_url: "sign.svg",
  product_types: "suits, sarees, kurtis and dupattas",
  job_kinds: DEFAULT_JOB_KINDS,
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
    if (!Array.isArray(merged.bill_contacts)) merged.bill_contacts = SHOP_DEFAULTS.bill_contacts;
    if (!Array.isArray(merged.bill_terms)) merged.bill_terms = DEFAULT_BILL_TERMS;
    if (!Array.isArray(merged.job_kinds) || merged.job_kinds.length === 0) merged.job_kinds = DEFAULT_JOB_KINDS;
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
