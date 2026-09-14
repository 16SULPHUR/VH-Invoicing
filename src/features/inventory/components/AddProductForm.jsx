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

const inputClass = "border-gray-600 bg-gray-700 text-gray-100";

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
        form.submit.mutate();
      }}
      className="space-y-4"
    >
      <div className="flex w-full items-center gap-5">
        <div className="flex items-center space-x-2">
          <Switch
            id="add-supplier"
            className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
            checked={form.isAddingNewSupplier}
            onCheckedChange={form.setIsAddingNewSupplier}
          />
          <Label htmlFor="add-supplier" className="text-nowrap text-pink-400">
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
          <Label htmlFor={key} className="text-pink-400">
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
        <Label htmlFor="images" className="text-pink-400">
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
                className="h-24 w-24 rounded object-cover"
              />
              <button
                type="button"
                aria-label={`Remove image ${index + 1}`}
                onClick={() => form.images.discard(index)}
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
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
        className="w-full bg-pink-600 text-white hover:bg-pink-700"
      >
        {form.submit.isPending ? "Adding…" : "Add Product"}
      </Button>
    </form>
  );
}
