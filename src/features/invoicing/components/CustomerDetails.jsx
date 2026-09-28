import { useState } from "react";
import { Check, ChevronsUpDown, Pencil } from "lucide-react";
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
import { ICON_STROKE } from "@/config/navigation";

function CustomerCombobox({ customers, value, onSelect, id }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between rounded-xl bg-surface-elevated font-medium hover:bg-surface"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Select customer"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[18rem] overflow-hidden rounded-2xl p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search customers…" value={search} onValueChange={setSearch} />
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.name ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                  <span className="flex w-full justify-between gap-2">
                    <span className="truncate">{customer.name}</span>
                    <span className="shrink-0 text-muted-foreground">{customer.address}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {search && (
              <CommandGroup heading="Use as typed">
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onSelect({ name: search });
                    setOpen(false);
                  }}
                >
                  {search}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CustomerDetails({
  customers,
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
}) {
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3">
      <Field
        label="Customer"
        htmlFor="customer-name"
        className="[&>label]:flex [&>label]:items-center [&>label]:justify-between"
      >
        {(id) =>
          isTyping ? (
            <Input
              id={id}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="h-10"
              autoComplete="name"
              /* Focus follows the explicit "type a new name" action, so it is expected. */
              autoFocus
            />
          ) : (
            <div className="flex gap-1">
              <CustomerCombobox
                id={id}
                customers={customers}
                value={customerName}
                onSelect={(customer) => {
                  setCustomerName(customer.name);
                  if (customer.phone) setCustomerNumber(customer.phone);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setIsTyping(true)}
                aria-label="Type a new customer name"
              >
                <Pencil size={15} strokeWidth={ICON_STROKE} aria-hidden />
              </Button>
            </div>
          )
        }
      </Field>

      <Field label="Phone" htmlFor="customer-number">
        {(id) => (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            value={customerNumber}
            onChange={(event) => setCustomerNumber(event.target.value)}
            className="h-10"
            autoComplete="tel"
          />
        )}
      </Field>
    </div>
  );
}
