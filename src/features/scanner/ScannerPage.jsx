import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CameraPanel } from "./components/CameraPanel";
import { ScanDetailsDialog } from "./components/ScanDetailsDialog";
import { ScannedItemsTable } from "./components/ScannedItemsTable";
import { useBarcodeCamera } from "./hooks/useBarcodeCamera";
import { useScanCart } from "./hooks/useScanCart";

export default function ScannerPage() {
  const { toast } = useToast();
  const cart = useScanCart();
  const beepRef = useRef(null);

  const [customerName, setCustomerName] = useState("");
  const [pendingScan, setPendingScan] = useState(null);

  const playBeep = useCallback(() => {
    if (!beepRef.current) beepRef.current = new Audio("/beep.wav");
    // Autoplay policies can block this; a silent scan is still a valid scan.
    beepRef.current.play().catch(() => {});
  }, []);

  const { findInCatalog } = cart;

  const handleDetected = useCallback(
    ({ barcode }) => {
      const product = findInCatalog(barcode);
      if (!product) {
        toast({
          title: "Unknown barcode",
          description: `${barcode} is not in the catalog.`,
          variant: "destructive",
        });
        return;
      }

      playBeep();
      setPendingScan({
        barcode,
        productName: product.name,
        quantity: 1,
        price: product.sellingPrice ?? 0,
      });
    },
    [findInCatalog, playBeep, toast]
  );

  const camera = useBarcodeCamera({ onDetected: handleDetected });
  const { stop: stopCamera, start: startCamera } = camera;

  // Pause the camera while the operator is confirming quantity and price.
  useEffect(() => {
    if (pendingScan) stopCamera();
  }, [pendingScan, stopCamera]);

  const confirmScan = () => {
    cart.addScan.mutate(
      { barcode: pendingScan.barcode, quantity: pendingScan.quantity, price: pendingScan.price },
      {
        onSuccess: () => {
          setPendingScan(null);
          startCamera();
        },
      }
    );
  };

  const handlePrint = () => {
    if (cart.items.length === 0) {
      toast({
        title: "Nothing to print",
        description: "Scan at least one product first.",
        variant: "destructive",
      });
      return;
    }
    cart.sendToPrinter.mutate(customerName);
  };

  const isBusy = cart.isLoading || cart.removeItem.isPending || cart.clearAll.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card className="p-4">
        <CameraPanel camera={camera} />

        <div className="mt-4 flex w-full gap-2">
          <Input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Enter Customer Name"
          />
          <Button onClick={handlePrint} disabled={cart.sendToPrinter.isPending}>
            Print
          </Button>
        </div>
      </Card>

      <Card className="mx-auto max-w-4xl p-4">
        <ScannedItemsTable
          items={cart.items}
          isLoading={cart.isLoading}
          isBusy={isBusy}
          onRefresh={cart.refetch}
          onClear={() => cart.clearAll.mutate()}
          onDelete={(barcode) => cart.removeItem.mutate(barcode)}
        />
      </Card>

      <ScanDetailsDialog
        scan={pendingScan}
        onChange={(field, value) => setPendingScan((previous) => ({ ...previous, [field]: value }))}
        onConfirm={confirmScan}
        onOpenChange={(open) => !open && setPendingScan(null)}
      />
    </div>
  );
}
