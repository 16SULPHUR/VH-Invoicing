import { useState } from "react";
import { LOW_STOCK_THRESHOLD } from "@/config/business";
import { formatRupees } from "@/utils/formatters";
import { swatchFor } from "@/utils/swatch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ProductRowActions } from "./ProductRowActions";

/** Click-to-edit stock cell; commits on Enter or blur, cancels on Escape. */
function QuantityCell({ product, onCommit }) {
  const [draft, setDraft] = useState(null);

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(String(product.quantity))}
        className="font-display text-base font-bold tabular-nums hover:text-rani"
      >
        {product.quantity}
      </button>
    );
  }

  const commit = () => {
    if (draft !== "" && !Number.isNaN(Number(draft))) {
      onCommit(product.id, Number(draft));
    }
    setDraft(null);
  };

  return (
    <Input
      type="number"
      value={draft}
      autoFocus
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") setDraft(null);
      }}
      className="h-8 w-20"
    />
  );
}

function StockLevel({ product, onCommit }) {
  const quantity = Number(product.quantity) || 0;
  const tone =
    quantity <= 0 ? "bg-destructive" : quantity <= LOW_STOCK_THRESHOLD ? "bg-marigold" : "bg-leaf";
  const width = Math.max(6, Math.min(100, (quantity / (LOW_STOCK_THRESHOLD * 4)) * 100));

  return (
    <div className="flex min-w-[7rem] flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <QuantityCell product={product} onCommit={onCommit} />
        {quantity <= 0 ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
            Out
          </span>
        ) : (
          quantity <= LOW_STOCK_THRESHOLD && (
            <span className="rounded-full bg-marigold/20 px-2 py-0.5 text-[11px] font-bold text-warning">
              Low
            </span>
          )
        )}
      </div>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ProductThumb({ product, onViewImages }) {
  const images = product.images ?? [];
  if (images.length > 0) {
    return (
      <button
        type="button"
        onClick={() => onViewImages(images)}
        className="block h-11 w-11 overflow-hidden rounded-xl border border-border"
        aria-label={`Show images of ${product.name}`}
      >
        <img loading="lazy" src={images[0]} alt="" className="h-full w-full object-cover" />
      </button>
    );
  }
  return (
    <span
      className="swatch block h-11 w-11 rounded-xl"
      style={{ backgroundColor: swatchFor(product.name) }}
      aria-hidden
    />
  );
}

export function ProductTable({
  products,
  showCost,
  selection,
  supplierNameFor,
  onQuantityCommit,
  rowActions,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_hsl(var(--indigo)/0.05)]">
      <Table>
        <TableHeader className="bg-surface-elevated">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all products"
                checked={selection.allSelected}
                onCheckedChange={selection.toggleAll}
              />
            </TableHead>
            <TableHead>Product</TableHead>
            {showCost && <TableHead className="text-right">Cost</TableHead>}
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden md:table-cell">Barcode</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={showCost ? 7 : 6} className="py-10 text-center text-muted-foreground">
                No products match these filters.
              </TableCell>
            </TableRow>
          )}

          {products.map((product) => {
            const supplierName = supplierNameFor(product.supplier);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${product.name}`}
                    checked={selection.selectedIds.has(product.id)}
                    onCheckedChange={() => selection.toggle(product.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductThumb product={product} onViewImages={rowActions.onViewImages} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{product.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {supplierName ?? "No supplier"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                {showCost && (
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatRupees(product.cost)}
                  </TableCell>
                )}
                <TableCell className="text-right font-display text-base font-bold tabular-nums">
                  {formatRupees(product.sellingPrice)}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {product.barcode}
                </TableCell>
                <TableCell>
                  <StockLevel product={product} onCommit={onQuantityCommit} />
                </TableCell>
                <TableCell>
                  <ProductRowActions product={product} supplierName={supplierName} {...rowActions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
