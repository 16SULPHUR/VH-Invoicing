import { useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/utils/formatters";
import { findByCode, searchProducts } from "../lib/shopTools";
import { ScanSheet } from "./ScanSheet";

/** Type a name or code (a USB scanner types and presses Enter), or scan tags with the camera. */
export function ProductSearch({ products, onPick, id, placeholder = "Search or scan a tag…" }) {
  const [term, setTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const matches = searchProducts(products, term, 6);

  const pick = (product) => {
    onPick(product);
    setTerm("");
  };

  const onCode = (code) => {
    const product = findByCode(products, code);
    if (!product) return { ok: false, message: `${code} is not in stock` };
    onPick(product);
    return { ok: true, message: `Added ${product.name}` };
  };

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={id}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || matches.length === 0) return;
            event.preventDefault();
            pick(findByCode(products, term) ?? matches[0]);
          }}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
        {matches.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            {matches.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => pick(product)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{product.name}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {product.barcode ?? "No code"} · {Number(product.quantity) || 0} in stock
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatRupees(product.sellingPrice)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button type="button" variant="outline" size="icon" className="press h-10 w-10 shrink-0" onClick={() => setScanning(true)} aria-label="Scan with camera">
        <Camera className="h-4 w-4" aria-hidden />
      </Button>
      <ScanSheet open={scanning} onClose={() => setScanning(false)} onCode={onCode} />
    </div>
  );
}
