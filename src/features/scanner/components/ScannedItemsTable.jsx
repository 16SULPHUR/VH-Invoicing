import { Loader2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/utils/formatters";

export function ScannedItemsTable({ items, isLoading, isBusy, onRefresh, onClear, onDelete }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Scanned Items</h2>
        <div className="flex gap-3">
          <Button onClick={onRefresh} disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
          <Button className="bg-red-600" onClick={onClear} disabled={isBusy || items.length === 0}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Quantity", "Price", "Action"].map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.barcode}>
                <TableCell className="font-mono">{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>₹{formatAmount(item.price)}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onDelete(item.barcode)}
                    disabled={isBusy}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  Nothing scanned yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
}
