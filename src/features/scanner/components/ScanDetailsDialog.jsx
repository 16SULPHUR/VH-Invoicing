import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ScanDetailsDialog({ scan, onChange, onConfirm, onOpenChange }) {
  return (
    <Dialog open={scan !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{scan?.productName ?? "Enter Product Details"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scanQuantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="scanQuantity"
              type="number"
              min="1"
              value={scan?.quantity ?? 1}
              onChange={(event) => onChange("quantity", Number(event.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scanPrice" className="text-right">
              Price
            </Label>
            <Input
              id="scanPrice"
              type="number"
              value={scan?.price ?? 0}
              onChange={(event) => onChange("price", Number(event.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onConfirm}>Add to Scan List</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
