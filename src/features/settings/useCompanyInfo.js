import { useMemo } from "react";
import { useGstSettings } from "@/features/reports/hooks/useGstSettings";
import { useShopSettings } from "./useShopSettings";

/** Name, address and GSTIN printed at the top of reports. */
export function useCompanyInfo() {
  const { settings } = useShopSettings();
  const { gst } = useGstSettings();
  return useMemo(
    () => ({ name: settings.shop_name, address: settings.address, gstin: gst.gstin }),
    [settings.shop_name, settings.address, gst.gstin]
  );
}

export const companyLines = (company) =>
  [company?.name, company?.address, company?.gstin && `GSTIN ${company.gstin}`].filter(Boolean);
