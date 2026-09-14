import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white focus:border-pink-500 focus:outline-none";

function CustomerCombobox({ customers, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-black"
        >
          {value || "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-[300px]">
          <CommandInput
            placeholder="Search customers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  className="text-black"
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onSelect(customer.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex w-full justify-between">
                    <span>{customer.name}</span>
                    <span className="text-gray-500">{customer.address}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {search && (
              <CommandGroup heading="Use as typed">
                <CommandItem
                  className="text-black"
                  value={search}
                  onSelect={() => {
                    onSelect(search);
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
  const [isTypingNewCustomer, setIsTypingNewCustomer] = useState(false);

  return (
    <div className="mb-4 flex w-full flex-col justify-between gap-4 md:flex-row">
      <div className="w-full md:w-[48%]">
        <div className="mb-2 flex items-center justify-between">
          <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="customerName">
            Customer Name:
          </label>
          <Switch
            id="type-new-customer"
            aria-label="Type a new customer name"
            className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
            checked={isTypingNewCustomer}
            onCheckedChange={setIsTypingNewCustomer}
          />
        </div>
        {isTypingNewCustomer ? (
          <input
            className={inputClass}
            type="text"
            id="customerName"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        ) : (
          <CustomerCombobox customers={customers} value={customerName} onSelect={setCustomerName} />
        )}
      </div>

      <div className="w-full md:w-[48%]">
        <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="customerNumber">
          Customer Number:
        </label>
        <input
          className={inputClass}
          type="text"
          id="customerNumber"
          placeholder="Customer Number"
          value={customerNumber}
          onChange={(event) => setCustomerNumber(event.target.value)}
        />
      </div>
    </div>
  );
}
