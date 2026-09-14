import { useEffect, useState } from "react";
import { BetweenHorizontalEnd, Check, ChevronsUpDown, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const inputClass =
  "w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white focus:border-pink-500 focus:outline-none";

function CatalogCombobox({ catalog, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const selected = catalog.find((product) => product.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-black"
        >
          {selected?.name ?? "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {catalog.map((product) => (
                <CommandItem
                  className="text-black"
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product.id === selectedId ? "" : product.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex w-full justify-between">
                    <span>{product.name}</span>
                    <span>₹ {product.sellingPrice}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ProductPicker({ catalog, lineForm, setLineForm, isEditingLine, onSubmit }) {
  const [selectedId, setSelectedId] = useState("");
  const [isTypingNewProduct, setIsTypingNewProduct] = useState(false);

  const setField = (field) => (event) =>
    setLineForm((previous) => ({ ...previous, [field]: event.target.value }));

  // Picking a catalog product prefills the line with its name, price and qty 1.
  useEffect(() => {
    if (!selectedId) return;
    const product = catalog.find((item) => item.id === selectedId);
    if (!product) return;

    setLineForm({
      name: product.name,
      quantity: "1",
      price: String(product.sellingPrice ?? ""),
    });
  }, [selectedId, catalog, setLineForm]);

  const handleSubmit = (event) => {
    onSubmit(event);
    setSelectedId("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-2">
      <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
        <div className="w-full md:w-[48%]">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-pink-500" htmlFor="productName">
              Product Name:
            </label>
            <Switch
              id="type-new-product"
              aria-label="Type a product not in the catalog"
              className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
              checked={isTypingNewProduct}
              onCheckedChange={setIsTypingNewProduct}
            />
          </div>
          {isTypingNewProduct ? (
            <input
              className={inputClass}
              type="text"
              id="productName"
              value={lineForm.name}
              onChange={setField("name")}
            />
          ) : (
            <CatalogCombobox catalog={catalog} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        <div className="w-full md:w-[24%]">
          <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="productQuantity">
            Quantity:
          </label>
          <input
            className={inputClass}
            type="number"
            id="productQuantity"
            value={lineForm.quantity}
            onChange={setField("quantity")}
            required
          />
        </div>

        <div className="w-full md:w-[24%]">
          <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="productPrice">
            Price:
          </label>
          <input
            className={inputClass}
            type="number"
            id="productPrice"
            value={lineForm.price}
            onChange={setField("price")}
            required
          />
        </div>

        <div className="w-full md:w-auto md:self-end">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-md bg-pink-600 px-6 py-2 text-white transition-colors hover:bg-pink-700 md:w-auto"
          >
            <div className="flex justify-center gap-3">
              {isEditingLine ? <PencilLine size={27} /> : <BetweenHorizontalEnd size={27} />}
              <span className="md:hidden">{isEditingLine ? "Update Item" : "Add Item"}</span>
            </div>
          </button>
        </div>
      </div>
    </form>
  );
}
