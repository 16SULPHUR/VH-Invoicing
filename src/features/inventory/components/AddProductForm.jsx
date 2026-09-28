import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAddProduct } from "../hooks/useAddProduct";
import { useSuppliers } from "../hooks/useInventory";

const FIELDS = [
  { key: "name", label: "Product Name", type: "text" },
  { key: "quantity", label: "Quantity", type: "number" },
  { key: "cost", label: "Cost", type: "number" },
  { key: "sellingPrice", label: "Selling Price", type: "number" },
];

const inputClass = "border-border bg-surface text-foreground";

export default function AddProductForm() {
  const { data: suppliers } = useSuppliers();
  const form = useAddProduct();
  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.submit.mutate(undefined, { onSuccess: () => firstFieldRef.current?.focus() });
      }}
      className="space-y-4"
    >
      <div className="flex w-full items-center gap-5">
        <div className="flex items-center space-x-2">
          <Switch
            id="add-supplier"

            checked={form.isAddingNewSupplier}
            onCheckedChange={form.setIsAddingNewSupplier}
          />
          <Label htmlFor="add-supplier" className="text-nowrap text-sm text-muted-foreground">
            New Supplier
          </Label>
        </div>

        <div className="w-full space-y-2">
          {form.isAddingNewSupplier ? (
            <Input
              id="newSupplierName"
              value={form.product.newSupplierName}
              onChange={(event) => form.setField("newSupplierName", event.target.value)}
              className={inputClass}
              placeholder="New Supplier Name"
              required
            />
          ) : (
            <Select
              value={form.product.supplier}
              onValueChange={(value) => form.setField("supplier", value)}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {FIELDS.map(({ key, label, type }, index) => (
        <div key={key} className="space-y-2">
          <Label
            htmlFor={key}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {label}:
          </Label>
          <Input
            id={key}
            type={type}
            ref={index === 0 ? firstFieldRef : undefined}
            value={form.product[key]}
            onChange={(event) => form.setField(key, event.target.value)}
            className={inputClass}
            required
          />
        </div>
      ))}

      <div className="space-y-2">
        <Label
          htmlFor="images"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Product Images:
        </Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => form.images.addFiles(event.target.files)}
          onClick={(event) => {
            event.target.value = null;
          }}
          className={inputClass}
        />
        <div className="flex flex-wrap gap-2">
          {form.images.previews.map((preview, index) => (
            <div key={preview} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                width={96}
                height={96}
                loading="lazy"
                className="h-24 w-24 rounded object-cover"
              />
              <button
                type="button"
                aria-label={`Remove image ${index + 1}`}
                onClick={() => form.images.discard(index)}
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-destructive "
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={form.submit.isPending}
        className="w-full bg-primary hover:bg-primary"
      >
        {form.submit.isPending ? "Adding…" : "Add Product"}
      </Button>
    </form>
  );
}
