import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { printJobError } from "@/features/printing/printJobBill";
import { PRINT_JOB_STATUS } from "@/services/printJobService";
import { CameraPanel } from "./components/CameraPanel";
import { PhonePrintPanel } from "./components/PhonePrintPanel";
import { ScanDetailsDialog } from "./components/ScanDetailsDialog";
import { ScannedItemsTable } from "./components/ScannedItemsTable";
import { useBarcodeCamera } from "./hooks/useBarcodeCamera";
import { useScanCart } from "./hooks/useScanCart";
import { usePhonePrint } from "./hooks/usePhonePrint";

export default function ScannerPage() {
  const { toast } = useToast();
  const cart = useScanCart();
  const beepRef = useRef(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const print = usePhonePrint();
  const { refetch: refetchScans } = cart;
  const printedJob = print.job?.status === PRINT_JOB_STATUS.SAVED ? print.job.id : null;
  // The till clears the printed scans; show that even if the live update was missed.
  useEffect(() => {
    if (printedJob) refetchScans();
  }, [printedJob, refetchScans]);
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

  const handlePrint = async () => {
    const job = {
      items: cart.items.map(({ name, barcode, quantity, price, amount }) => ({
        name,
        barcode,
        quantity,
        price,
        amount,
      })),
      scan_ids: cart.items.flatMap((item) => item.scanIds),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      payment_mode: paymentMode,
    };
    const problem = printJobError(job);
    if (problem) {
      toast({ title: "Can't print yet", description: problem, variant: "destructive" });
      return;
    }
    if (await print.send(job)) {
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMode("");
    }
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

      <PhonePrintPanel
        print={print}
        customerName={customerName}
        customerPhone={customerPhone}
        paymentMode={paymentMode}
        onCustomerName={setCustomerName}
        onCustomerPhone={setCustomerPhone}
        onPaymentMode={setPaymentMode}
        onPrint={handlePrint}
      />

      <ScanDetailsDialog
        scan={pendingScan}
        onChange={(field, value) => setPendingScan((previous) => ({ ...previous, [field]: value }))}
        onConfirm={confirmScan}
        onOpenChange={(open) => !open && setPendingScan(null)}
      />
    </div>
  );
}
