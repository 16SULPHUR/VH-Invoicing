import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CustomerName = ({ customers, placeholder, onSelect, value }) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-black"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-[300px]">
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandList>
            {customers.map((customer) => (
              <CommandItem
                className="text-black"
                key={customer.id}
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
                  <span>{customer.name.toString().split()[0]}</span>
                  <span>{customer.address}</span>
                </div>
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() => {
                onSelect(searchInput);
                setOpen(false);
              }}
            >
              {searchInput}
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CustomerDetails = ({
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
}) => {
  const [customers, setCustomers] = useState([]);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select();

      if (customersError)
        console.error("Error fetching customers:", customersError);
      else setCustomers(customersData);
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between mb-4 w-full gap-4">
      <div className="w-full md:w-[48%]">
        <div className="flex items-center justify-between mb-2">
          <label
            className="block mb-1 font-bold text-sky-500 text-sm"
            htmlFor="customerName"
          >
            Customer Name:
          </label>

          <Switch
            id="add-supplier"
            className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
            checked={isAddingNewCustomer}
            onCheckedChange={setIsAddingNewCustomer}
          />
        </div>
        {isAddingNewCustomer ? (
          <input
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        ) : (
          <CustomerName
            customers={customers}
            placeholder="Select customer..."
            onSelect={setCustomerName}
            value={customerName}
          />
        )}
      </div>
      <div className="w-full md:w-[48%]">
        <label
          className="block mb-1 font-bold text-sky-500 text-sm"
          htmlFor="customerNumber"
        >
          Customer Number:
        </label>
        <input
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
          type="text"
          id="customerNumber"
          placeholder="Customer Number"
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CustomerDetails;
