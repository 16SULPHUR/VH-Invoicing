import { useCallback } from "react";
import { usePrintDocument } from "@/features/invoicing/hooks/useInvoicePrinting";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { useToast } from "@/hooks/use-toast";
import { Slip } from "../components/Slip";

/** Prints an A6 slip (see Slip) through the bill's print window. */
export function usePrintSlip() {
  const printDocument = usePrintDocument();
  const { settings } = useShopSettings();
  const { toast } = useToast();
  return useCallback(
    (slip) => {
      const printed = printDocument(<Slip shop={{ name: settings.shop_name, phone: settings.phone }} {...slip} />, {
        title: `${slip.kind} ${slip.token}`,
        pageSize: "105mm 148mm",
      });
      if (!printed) toast({ variant: "destructive", title: "Print blocked", description: "Allow pop-ups for this site to print slips." });
    },
    [printDocument, settings.shop_name, settings.phone, toast]
  );
}
