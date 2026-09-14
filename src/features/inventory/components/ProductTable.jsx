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
      className="w-20 border-gray-600 bg-gray-700 text-gray-100"
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
          <TableHead className="w-12 text-pink-400" />
          <TableHead className="text-pink-400">Name</TableHead>
          {showCost && <TableHead className="text-pink-400">Cost</TableHead>}
          <TableHead className="text-pink-400">Selling Price</TableHead>
          <TableHead className="text-pink-400">Barcode</TableHead>
          <TableHead className="text-pink-400">Quantity</TableHead>
          <TableHead className="text-pink-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={showCost ? 8 : 7} className="text-center text-gray-400">
              No products match these filters.
            </TableCell>
          </TableRow>
        )}

        {products.map((product) => {
          const images = product.images ?? [];
          return (
            <TableRow key={product.id} className="text-white">
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
                  <span className="text-[13px] text-pink-500">
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
