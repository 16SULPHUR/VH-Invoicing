import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BATCH_EDIT_FIELDS } from "../batchEdit";

const FIELD_LABELS = {
  sellingPrice: "Selling Price",
  cost: "Cost",
  quantity: "Quantity",
};

export function BatchEditDialog({
  open,
  onOpenChange,
  batchEditData,
  setField,
  onApply,
  count,
  isSaving,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Batch Edit Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {BATCH_EDIT_FIELDS.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`batch-${field}`} className="text-pink-400">
                {FIELD_LABELS[field]}:
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`batch-${field}`}
                  type="number"
                  value={batchEditData[field].value}
                  onChange={(event) => setField(field, { value: event.target.value })}
                  className="border-gray-600 bg-gray-700 text-gray-100"
                  placeholder={`Leave blank to keep current ${FIELD_LABELS[field].toLowerCase()}`}
                />
                <Select
                  value={batchEditData[field].type}
                  onValueChange={(value) => setField(field, { type: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onApply}
          disabled={isSaving}
          className="w-full bg-pink-600 text-white hover:bg-pink-700"
        >
          {isSaving ? "Updating…" : `Update ${count} Products`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
