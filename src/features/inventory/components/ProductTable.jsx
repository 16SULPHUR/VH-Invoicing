import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        className="cursor-pointer hover:underline"
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
      className="w-20 border-border bg-surface text-foreground"
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
    <Table className="rounded-md bg-[#09090b]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              aria-label="Select all products"
              checked={selection.allSelected}
              onCheckedChange={selection.toggleAll}
            />
          </TableHead>
          <TableHead className="w-12" />
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Name
          </TableHead>
          {showCost && (
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Cost
            </TableHead>
          )}
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Selling Price
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Barcode
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Quantity
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={showCost ? 8 : 7} className="text-center text-muted-foreground">
              No products match these filters.
            </TableCell>
          </TableRow>
        )}

        {products.map((product) => {
          const images = product.images ?? [];
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
                {images.length > 0 && (
                  <Avatar
                    className="cursor-pointer"
                    onClick={() => rowActions.onViewImages(images)}
                  >
                    <AvatarImage loading="lazy" src={images[0]} alt={product.name} />
                    <AvatarFallback>
                      <ImageIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-[13px] text-primary">
                    {supplierNameFor(product.supplier) ?? "—"}
                  </span>
                </div>
              </TableCell>
              {showCost && <TableCell>₹{product.cost}</TableCell>}
              <TableCell>₹{product.sellingPrice}</TableCell>
              <TableCell>{product.barcode}</TableCell>
              <TableCell>
                <QuantityCell product={product} onCommit={onQuantityCommit} />
              </TableCell>
              <TableCell>
                <ProductRowActions
                  product={product}
                  supplierName={supplierNameFor(product.supplier)}
                  {...rowActions}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
