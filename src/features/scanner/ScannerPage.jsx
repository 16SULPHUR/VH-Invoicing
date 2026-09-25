import { useCallback, useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { creditCustomerError } from "@/utils/invoice";
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
  const [customerPhone, setCustomerPhone] = useState("");
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
    // Nothing is paid on the phone, so the bill goes on credit at the till.
    const customerError = creditCustomerError({
      payments: { credit: 1 },
      customerName,
      customerNumber: customerPhone,
    });
    if (customerError) {
      toast({ title: "Customer needed", description: customerError, variant: "destructive" });
      return;
    }
    cart.sendToPrinter.mutate(
      { customerName, customerPhone },
      {
        onSuccess: () => {
          setCustomerName("");
          setCustomerPhone("");
        },
      }
    );
  };

  const isBusy = cart.isLoading || cart.removeItem.isPending || cart.clearAll.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <PageHeader title="Scan" subtitle="Scans sync to the till in real time" />

      <CameraPanel camera={camera} />

      <ScannedItemsTable
        items={cart.items}
        isLoading={cart.isLoading}
        isBusy={isBusy}
        onRefresh={cart.refetch}
        onClear={() => cart.clearAll.mutate()}
        onDelete={(barcode) => cart.removeItem.mutate(barcode)}
      />

      <div className="flex w-full flex-wrap gap-2">
        <Input
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Customer name"
          autoComplete="name"
          className="min-w-[9rem] flex-1 bg-surface"
        />
        <Input
          type="tel"
          inputMode="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          placeholder="Phone"
          autoComplete="tel"
          className="w-36 bg-surface"
        />
        <Button
          onClick={handlePrint}
          disabled={cart.sendToPrinter.isPending}
          className="block-shadow h-10"
        >
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <ScanDetailsDialog
        scan={pendingScan}
        onChange={(field, value) => setPendingScan((previous) => ({ ...previous, [field]: value }))}
        onConfirm={confirmScan}
        onOpenChange={(open) => !open && setPendingScan(null)}
      />
    </div>
  );
}
