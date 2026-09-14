import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_FIELDS } from "../productFilters";

export function ProductFilterPanel({ filters, setFilters, onApply }) {
  const setPriceBound = (bound) => (event) =>
    setFilters((previous) => ({
      ...previous,
      priceRange: { ...previous.priceRange, [bound]: event.target.value },
    }));

  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select
          value={filters.sortField}
          onValueChange={(value) => setFilters((previous) => ({ ...previous, sortField: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELDS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid max-w-xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex gap-4">
          <Input
            type="number"
            placeholder="Min Price"
            value={filters.priceRange.min}
            onChange={setPriceBound("min")}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Max Price"
            value={filters.priceRange.max}
            onChange={setPriceBound("max")}
            className="w-32"
          />
        </div>
        <Button onClick={onApply} className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
