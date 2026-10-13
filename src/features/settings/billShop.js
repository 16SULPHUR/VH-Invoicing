import { GST_DEFAULTS } from "@/features/reports/lib/gst";
import { shopSettingsService } from "@/services/shopSettingsService";
import { SHOP_DEFAULTS, DEFAULT_BILL_TERMS } from "./useShopSettings";

const lines = (value, fallback) => (Array.isArray(value) ? value.filter(Boolean) : fallback);

/** What the printed bill shows. Read from the saved copy so PDFs and print windows need no hook. */
export function readBillShop() {
  const saved = { ...SHOP_DEFAULTS, ...shopSettingsService.readLocal() };
  const gstin = (saved.gst?.gstin ?? GST_DEFAULTS.gstin).trim();
  const contacts = lines(saved.bill_contacts, SHOP_DEFAULTS.bill_contacts);
  return {
    name: saved.shop_name,
    address: saved.address,
    contacts: gstin ? [...contacts, `GSTIN ${gstin}`] : contacts,
    terms: lines(saved.bill_terms, DEFAULT_BILL_TERMS),
    logoUrl: saved.logo_url,
    signatureUrl: saved.signature_url,
  };
}
