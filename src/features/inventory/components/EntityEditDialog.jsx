import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** One dialog shape for both products and suppliers; `fields` decides the form. */
export function EntityEditDialog({ title, fields, entity, onChange, onSubmit, onClose, isSaving }) {
  return (
    <Dialog open={entity !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {entity && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="space-y-4"
          >
            {fields.map(({ key, label, type, parse }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`edit-${key}`} className="text-pink-400">
                  {label}:
                </Label>
                <Input
                  id={`edit-${key}`}
                  type={type}
                  value={entity[key] ?? ""}
                  onChange={(event) =>
                    onChange(key, parse ? parse(event.target.value) : event.target.value)
                  }
                  className="border-gray-600 bg-gray-700 text-gray-100"
                  required
                />
              </div>
            ))}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-pink-600 text-white hover:bg-pink-700"
            >
              {isSaving ? "Saving…" : `Update ${title.replace("Edit ", "")}`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
