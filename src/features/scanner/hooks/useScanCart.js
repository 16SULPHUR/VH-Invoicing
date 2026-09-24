import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { productService } from "@/services/productService";
import { scannedProductService, printCommandService } from "@/services/scannedProductService";
import { useToast } from "@/hooks/use-toast";

/** Folds raw scan rows into one line per barcode, resolved against the catalog. */
function buildCart(scannedRows, catalog) {
  const byBarcode = new Map();

  for (const row of scannedRows) {
    const barcode = String(row.name);
    const product = catalog.find((item) => String(item?.barcode ?? "") === barcode);
    if (!product) {
      console.warn(`Product with barcode ${barcode} not found in catalog`);
      continue;
    }

    const quantity = row.quantity || 1;
    const price = row.price || product.sellingPrice || 0;
    const existing = byBarcode.get(barcode);

    if (existing) {
      existing.quantity += quantity;
      existing.amount = existing.quantity * existing.price;
    } else {
      byBarcode.set(barcode, {
        name: product.name,
        barcode,
        quantity,
        price,
        amount: quantity * price,
      });
    }
  }

  return Array.from(byBarcode.values());
}

export function useScanCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: catalog = [] } = useQuery({
    queryKey: queryKeys.products.catalog,
    queryFn: () => productService.listForCache(),
    placeholderData: [],
  });

  const scanned = useQuery({
    queryKey: queryKeys.scannedProducts.all,
    queryFn: () => scannedProductService.list(),
    select: (rows) => buildCart(rows, catalog),
    enabled: catalog.length > 0,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.scannedProducts.all }),
    [queryClient]
  );

  const notifyError = (title) => (error) =>
    toast({ title, description: error.message, variant: "destructive" });

  const addScan = useMutation({
    mutationFn: (scan) => scannedProductService.add(scan),
    onSuccess: invalidate,
    onError: notifyError("Failed to add scanned item"),
  });

  const removeItem = useMutation({
    mutationFn: (barcode) => scannedProductService.removeByBarcode(barcode),
    onSuccess: () => {
      invalidate();
      toast({ title: "Item deleted", description: "The item has been removed." });
    },
    onError: notifyError("Failed to delete the item"),
  });

  const clearAll = useMutation({
    mutationFn: () => scannedProductService.clear(),
    onSuccess: () => {
      invalidate();
      toast({ title: "All items cleared", description: "The scan list is now empty." });
    },
    onError: notifyError("Failed to clear scanned items"),
  });

  const sendToPrinter = useMutation({
    mutationFn: (customerName) => printCommandService.requestPrint(customerName),
    onSuccess: () => toast({ title: "Print sent", description: "The till is printing this bill." }),
    onError: notifyError("Error sending to print"),
  });

  const findInCatalog = useCallback(
    (barcode) => catalog.find((item) => String(item?.barcode ?? "") === String(barcode)),
    [catalog]
  );

  return {
    catalog,
    items: scanned.data ?? [],
    isLoading: scanned.isLoading,
    refetch: scanned.refetch,
    findInCatalog,
    addScan,
    removeItem,
    clearAll,
    sendToPrinter,
  };
}
