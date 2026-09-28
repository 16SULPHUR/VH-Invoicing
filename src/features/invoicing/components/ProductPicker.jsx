import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field } from "@/components/common/Field";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils/formatters";
import { ICON_STROKE } from "@/config/navigation";

function CatalogCombobox({ catalog, selectedId, onSelect, onTypeName, typedName, id }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = catalog.find((product) => product.id === selectedId);
  const shown = selected?.name || typedName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !shown && "text-muted-foreground")}>
            {shown || "Select product"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products…" value={search} onValueChange={setSearch} />
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {catalog.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === product.id ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                  <span className="flex w-full justify-between gap-2">
                    <span className="truncate">{product.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatAmount(product.sellingPrice)}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {search && (
              <CommandGroup heading="Not in catalog">
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onTypeName(search);
                    onSelect("");
                    setOpen(false);
                  }}
                >
                  Add &quot;{search}&quot; as a one-off
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ProductPicker({ catalog, lineForm, setLineForm, isEditingLine, onSubmit }) {
  const [selectedId, setSelectedId] = useState("");

  const setField = (field) => (event) =>
    setLineForm((previous) => ({ ...previous, [field]: event.target.value }));

  // Picking a catalog product prefills name, price and a quantity of one.
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
    <form
      onSubmit={handleSubmit}
      className="grid items-end gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[1fr_5rem_7rem_auto]"
    >
      <Field label="Product" htmlFor="line-product">
        {(id) => (
          <CatalogCombobox
            id={id}
            catalog={catalog}
            selectedId={selectedId}
            onSelect={setSelectedId}
            typedName={lineForm.name}
            onTypeName={(name) => setLineForm((previous) => ({ ...previous, name }))}
          />
        )}
      </Field>

      <Field label="Qty" htmlFor="line-qty">
        {(id) => (
          <Input
            id={id}
            type="number"
            autoComplete="off"
            inputMode="numeric"
            min="1"
            value={lineForm.quantity}
            onChange={setField("quantity")}
            className="h-9 text-right tabular-nums"
            required
          />
        )}
      </Field>

      <Field label="Price" htmlFor="line-price">
        {(id) => (
          <Input
            id={id}
            type="number"
            autoComplete="off"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={lineForm.price}
            onChange={setField("price")}
            className="h-9 text-right tabular-nums"
            required
          />
        )}
      </Field>

      <Button type="submit" className="press h-9">
        <Plus size={16} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
        {isEditingLine ? "Update" : "Add"}
      </Button>
    </form>
  );
}
