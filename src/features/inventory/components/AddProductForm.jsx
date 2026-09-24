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
  { key: "name", label: "Product name", type: "text", wide: true },
  { key: "quantity", label: "Quantity", type: "number" },
  { key: "cost", label: "Cost ₹", type: "number" },
  { key: "sellingPrice", label: "Selling price ₹", type: "number" },
];

const labelClass = "text-xs font-semibold text-muted-foreground";

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
      className="max-w-2xl space-y-5 rounded-2xl border border-border/70 bg-surface p-5"
    >
      <div>
        <h2 className="font-display text-xl font-bold">Add a product</h2>
        <p className="text-sm text-muted-foreground">It gets a barcode and shows up in billing straight away.</p>
      </div>

      <div className="flex w-full items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="add-supplier"
            checked={form.isAddingNewSupplier}
            onCheckedChange={form.setIsAddingNewSupplier}
          />
          <Label htmlFor="add-supplier" className="text-nowrap text-sm font-semibold">
            New supplier
          </Label>
        </div>

        <div className="w-full">
          {form.isAddingNewSupplier ? (
            <Input
              id="newSupplierName"
              value={form.product.newSupplierName}
              onChange={(event) => form.setField("newSupplierName", event.target.value)}
             
              placeholder="New supplier name"
              required
            />
          ) : (
            <Select
              value={form.product.supplier}
              onValueChange={(value) => form.setField("supplier", value)}
            >
              <SelectTrigger>
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

      <div className="grid grid-cols-3 gap-3">
      {FIELDS.map(({ key, label, type, wide }, index) => (
        <div key={key} className={wide ? "col-span-3 space-y-1.5" : "space-y-1.5"}>
          <Label htmlFor={key} className={labelClass}>
            {label}
          </Label>
          <Input
            id={key}
            type={type}
            ref={index === 0 ? firstFieldRef : undefined}
            value={form.product[key]}
            onChange={(event) => form.setField(key, event.target.value)}
           
            required
          />
        </div>
      ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images" className={labelClass}>
          Photos
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
                className="h-24 w-24 rounded-xl object-cover"
              />
              <button
                type="button"
                aria-label={`Remove image ${index + 1}`}
                onClick={() => form.images.discard(index)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white"
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
        variant="rani"
        className="block-shadow h-11 w-full text-base"
      >
        {form.submit.isPending ? "Adding…" : "Add product"}
      </Button>
    </form>
  );
}
