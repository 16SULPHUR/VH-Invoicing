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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{scan?.productName ?? "Product details"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="scanQuantity" className="text-xs font-semibold text-muted-foreground">
              Quantity
            </Label>
            <Input
              id="scanQuantity"
              type="number"
              min="1"
              value={scan?.quantity ?? 1}
              onChange={(event) => onChange("quantity", Number(event.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scanPrice" className="text-xs font-semibold text-muted-foreground">
              Price ₹
            </Label>
            <Input
              id="scanPrice"
              type="number"
              value={scan?.price ?? 0}
              onChange={(event) => onChange("price", Number(event.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} variant="rani" className="block-shadow w-full">
            Add to scan list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
