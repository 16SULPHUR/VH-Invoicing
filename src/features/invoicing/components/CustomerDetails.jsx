import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
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
import { NewCustomerDialog } from "@/features/customers/components/NewCustomerDialog";
import { findKnownCustomer, normalizePhone } from "@/utils/invoice";

const details = (customer) => [customer.remarks, customer.phone, customer.address].map((part) => String(part ?? "").trim()).filter(Boolean).join(" · ");

function CustomerCombobox({ customers, value, phone, chosenId, onSelect, onAddNew, id }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const digits = normalizePhone(phone);
  const picked = customers.find((customer) => customer.id === chosenId && customer.name === value);
  const isChosen = (customer) =>
    picked ? customer === picked : customer.name === value && (!digits || normalizePhone(customer.phone) === digits);
  const chosen = customers.find(isChosen);

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
            {chosen?.remarks && <span className="ml-1.5 text-xs text-muted-foreground">· {chosen.remarks}</span>}
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
                  value={`${customer.name} ${details(customer)} ${customer.id}`}
                  onSelect={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isChosen(customer) ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{customer.name}</span>
                    {details(customer) && <span className="block truncate text-xs text-muted-foreground">{details(customer)}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value={`__new ${search}`}
                onSelect={() => {
                  setOpen(false);
                  onAddNew(search);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                {search ? `Add “${search}” as a new customer` : "Add a new customer"}
              </CommandItem>
            </CommandGroup>
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
  const [adding, setAdding] = useState(null);
  const [chosenId, setChosenId] = useState(null);
  const known = findKnownCustomer(customers, customerName);

  const choose = (customer) => {
    setChosenId(customer.id);
    setCustomerName(customer.name);
    setCustomerNumber(customer.phone ? String(customer.phone) : "");
  };

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3">
      <Field label="Customer" htmlFor="customer-name" required>
        {(id) => (
          <CustomerCombobox
            id={id}
            customers={customers}
            value={customerName}
            phone={customerNumber}
            chosenId={chosenId}
            onSelect={choose}
            onAddNew={setAdding}
          />
        )}
      </Field>

      <Field label="Phone" htmlFor="customer-number">
        {(id) => (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            value={customerNumber}
            onChange={(event) => setCustomerNumber(event.target.value)}
            placeholder={known ? "Not needed" : ""}
            className="h-10"
            autoComplete="tel"
          />
        )}
      </Field>

      {adding !== null && (
        <NewCustomerDialog open initialName={adding} onOpenChange={(open) => !open && setAdding(null)} onCreated={choose} />
      )}
    </div>
  );
}
