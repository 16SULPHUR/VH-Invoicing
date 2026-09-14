import { useCallback, useEffect } from "react";
import { scannedProductService } from "@/services/scannedProductService";
import { useToast } from "@/hooks/use-toast";

function findByBarcode(catalog, barcode) {
  return catalog?.find((product) => String(product?.barcode ?? "") === String(barcode));
}

function toLine(product, barcode, quantity, price) {
  return {
    name: product.name,
    barcode: String(barcode),
    quantity,
    price,
    amount: quantity * price,
  };
}

/**
 * Mirrors the shared `scanned_products` table into the invoice draft: a full read
 * on mount, then incremental updates from the realtime channel.
 */
export function useScannedProducts({ catalog, setLines, enabled = true }) {
  const { toast } = useToast();

  const loadScannedProducts = useCallback(async () => {
    if (!catalog?.length) return;

    try {
      const scanned = await scannedProductService.list();
      const byBarcode = new Map();
      let unmatched = 0;

      for (const row of scanned) {
        const barcode = row.name;
        const product = findByBarcode(catalog, barcode);
        if (!product) {
          unmatched += 1;
          continue;
        }

        const quantity = row.quantity || 1;
        const price = row.price || product.sellingPrice;
        const existing = byBarcode.get(String(barcode));

        if (existing) {
          existing.quantity += quantity;
          existing.price = price;
          existing.amount = existing.quantity * price;
        } else {
          byBarcode.set(String(barcode), toLine(product, barcode, quantity, price));
        }
      }

      setLines(Array.from(byBarcode.values()));

      if (unmatched > 0) {
        toast({
          title: "Warning",
          description: `${unmatched} scanned item(s) were not found in the catalog.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching scanned products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch scanned products. Please try again.",
        variant: "destructive",
      });
    }
  }, [catalog, setLines, toast]);

  const applyScan = useCallback(
    (payload) => {
      const row = payload?.new;
      if (!row) return;

      const barcode = String(row.name);
      const product = findByBarcode(catalog, barcode);
      if (!product) {
        toast({
          title: "Error",
          description: `Product with barcode ${barcode} is not in the catalog.`,
          variant: "destructive",
        });
        return;
      }

      const quantity = row.quantity || 1;
      const price = row.price || product.sellingPrice;

      setLines((previous) => {
        const index = previous.findIndex((line) => String(line.barcode) === barcode);
        if (index === -1) return [toLine(product, barcode, quantity, price), ...previous];

        return previous.map((line, i) => {
          if (i !== index) return line;
          const newQuantity = line.quantity + quantity;
          return { ...line, quantity: newQuantity, price, amount: newQuantity * price };
        });
      });

      toast({
        title: "Product Scanned",
        description: `${product.name} has been added to the invoice.`,
      });
    },
    [catalog, setLines, toast]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    loadScannedProducts();
    return scannedProductService.subscribe(applyScan);
  }, [enabled, loadScannedProducts, applyScan]);

  const clearScannedProducts = useCallback(async () => {
    try {
      await scannedProductService.clear();
    } catch (error) {
      console.error("Error clearing scanned items:", error);
      toast({
        title: "Error",
        description: "Failed to clear scanned items. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { loadScannedProducts, clearScannedProducts };
}
