import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FiltersAndSorting = ({
  productSearchTerm,
  setProductSearchTerm,
  selectedSupplier,
  setSelectedSupplier,
  suppliers,
}) => {
  return (
    <div className="flex justify-around items-center mb-4 gap-5 w-full mt-2">
      <Input
        placeholder="Search products, supplier, barcode..."
        value={productSearchTerm}
        onChange={(e) => setProductSearchTerm(e.target.value)}
        className="bg-gray-700 border-gray-600 text-gray-100"
      />
      <Select onValueChange={setSelectedSupplier} defaultValue="all">
        <SelectTrigger className="w-[200px] text-pink-400">
          <SelectValue placeholder="Select a supplier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Suppliers</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FiltersAndSorting;