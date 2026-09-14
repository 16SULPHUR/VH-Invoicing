import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** One dialog shape for both products and suppliers; `fields` decides the form. */
export function EntityEditDialog({ title, fields, entity, onChange, onSubmit, onClose, isSaving }) {
  return (
    <Dialog open={entity !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface text-foreground">
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
                <Label
                  htmlFor={`edit-${key}`}
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {label}:
                </Label>
                <Input
                  id={`edit-${key}`}
                  type={type}
                  value={entity[key] ?? ""}
                  onChange={(event) =>
                    onChange(key, parse ? parse(event.target.value) : event.target.value)
                  }
                  className="border-border bg-surface text-foreground"
                  required
                />
              </div>
            ))}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary"
            >
              {isSaving ? "Saving…" : `Update ${title.replace("Edit ", "")}`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
