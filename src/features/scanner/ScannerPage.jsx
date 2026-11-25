import { useCallback, useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ICON_STROKE } from "@/config/navigation";
import { InvoiceWorkspace } from "@/features/invoicing/components/InvoiceWorkspace";
import { TotalBar } from "@/features/invoicing/components/TotalBar";
import { useInvoiceWorkspace } from "@/features/invoicing/hooks/useInvoiceWorkspace";
import { RemotePrintStatus } from "@/features/printing/RemotePrintStatus";
import { CameraPanel } from "./components/CameraPanel";
import { useBarcodeCamera } from "./hooks/useBarcodeCamera";
import { REPRINT_KEY, usePhonePrint } from "./hooks/usePhonePrint";

const findByBarcode = (catalog, barcode) =>
  catalog?.find((product) => String(product?.barcode ?? "") === String(barcode));

/** The till on a phone: scan or search, agree the price, save the bill, print it at the till. */
export default function ScannerPage() {
  const { toast } = useToast();
  const beepRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const remote = usePhonePrint({ storageKey: REPRINT_KEY, legacy: false });
  const workspace = useInvoiceWorkspace({ persistKey: "vh-phone-draft", remote });
  const { draft, catalog } = workspace;
  const { addProduct } = draft;

  const handleDetected = useCallback(
    ({ barcode }) => {
      const product = findByBarcode(catalog, barcode);
      if (!product) {
        toast({
          title: "Unknown barcode",
          description: `${barcode} is not in the catalog.`,
          variant: "destructive",
        });
        return;
      }
      if (!beepRef.current) beepRef.current = new Audio("/beep.wav");
      beepRef.current.play().catch(() => {});
      addProduct(product, barcode);
      toast({ title: product.name, description: "Added to the bill." });
    },
    [catalog, addProduct, toast]
  );

  const camera = useBarcodeCamera({ onDetected: handleDetected });
  const { start: startCamera, stop: stopCamera } = camera;

  useEffect(() => {
    if (showCamera) startCamera();
    else stopCamera();
  }, [showCamera, startCamera, stopCamera]);
  useEffect(() => stopCamera, [stopCamera]);

  const scanner = (
    <div className="space-y-3">
      <Button
        type="button"
        variant={showCamera ? "outline" : "rani"}
        className="press h-12 w-full text-base font-bold"
        onClick={() => setShowCamera((open) => !open)}
      >
        <ScanLine size={18} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
        {showCamera ? "Close scanner" : "Scan a barcode"}
      </Button>
      {showCamera && <CameraPanel camera={camera} />}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InvoiceWorkspace
        compact
        scanner={scanner}
        draft={draft}
        catalog={catalog}
        customers={workspace.customers}
        invoiceId={workspace.displayedInvoiceId}
        isOnline={workspace.isOnline}
      />

      <div className="shrink-0 space-y-2 px-3 pb-2 pt-1">
        <RemotePrintStatus print={remote} invoiceId={remote.job?.invoice_id} />
        <TotalBar
          draft={draft}
          onSubmit={workspace.submitInvoice}
          onCancelEdit={workspace.cancelEdit}
          isSubmitting={workspace.isSubmitting}
          submitLabel="Save & print at till"
          className="w-full"
        />
      </div>
    </div>
  );
}
