import { useCallback, useEffect, useRef } from "react";
import { scannedProductService } from "@/services/scannedProductService";
import { useToast } from "@/hooks/use-toast";

const RELOAD_DEBOUNCE_MS = 300;

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
 * Mirrors the shared `scanned_products` table into the invoice draft. The scan list
 * owns every barcoded line; lines typed in at the till are left alone. While
 * `paused` (editing an old bill) scans wait in the table instead.
 */
export function useScannedProducts({ catalog, setLines, enabled = true, paused = false }) {
  const { toast } = useToast();

  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const loadScannedProducts = useCallback(async () => {
    const currentCatalog = catalogRef.current;
    if (!currentCatalog?.length || pausedRef.current) return;

    try {
      const scanned = await scannedProductService.list();
      const byBarcode = new Map();
      let unmatched = 0;

      for (const row of scanned) {
        const barcode = String(row.name);
        const product = findByBarcode(currentCatalog, barcode);
        if (!product) {
          unmatched += 1;
          continue;
        }

        const quantity = row.quantity || 1;
        const price = row.price || product.sellingPrice;
        const existing = byBarcode.get(barcode);

        if (existing) {
          existing.quantity += quantity;
          existing.price = price;
          existing.amount = existing.quantity * price;
        } else {
          byBarcode.set(barcode, toLine(product, barcode, quantity, price));
        }
      }

      if (pausedRef.current) return;
      setLines((previous) => [...byBarcode.values(), ...previous.filter((line) => !line.barcode)]);

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
  }, [setLines, toast]);

  const reloadTimer = useRef(null);
  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(loadScannedProducts, RELOAD_DEBOUNCE_MS);
  }, [loadScannedProducts]);
  useEffect(() => () => clearTimeout(reloadTimer.current), []);

  const applyScan = useCallback(
    (payload) => {
      if (pausedRef.current) return;

      // Deletes carry only the row id, so rebuild from the table.
      if (payload?.eventType === "DELETE") {
        scheduleReload();
        return;
      }
      if (payload?.eventType !== "INSERT") return;

      const row = payload.new;
      if (!row?.name) return;

      const barcode = String(row.name);
      const product = findByBarcode(catalogRef.current, barcode);
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
    [scheduleReload, setLines, toast]
  );

  // Load once the catalog arrives; later catalog refreshes (stock changes) must not reload.
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!enabled || hasLoaded.current) return;
    hasLoaded.current = true;
    loadScannedProducts();
  }, [enabled, loadScannedProducts]);

  useEffect(() => {
    if (!enabled) return undefined;
    return scannedProductService.subscribe(applyScan);
  }, [enabled, applyScan]);

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
