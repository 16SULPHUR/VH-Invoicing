import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberField, Segmented } from "./designer/fields";
import { DPI_OPTIONS, printerSettings } from "./printerSettings";

/** This till's label printer: nudge the print into place and check it with a test label. */
export function PrinterDialog({ open, onOpenChange, printer, onTestPrint }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">Printer alignment</DialogTitle>
          <DialogDescription>
            Saved on this device only. Print a test label: the box should sit on the label edge and the cross in its centre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Move right (mm)" step={0.1} min={-10} max={10} value={printer.x} onChange={(x) => printerSettings.set({ x })} />
          <NumberField label="Move down (mm)" step={0.1} min={-10} max={10} value={printer.y} onChange={(y) => printerSettings.set({ y })} />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Negative moves left or up. Arrow keys step 0.1 mm, with Shift 1 mm.</p>
        <Segmented
          label="Printer resolution"
          value={printer.dpi}
          onChange={(dpi) => printerSettings.set({ dpi })}
          options={DPI_OPTIONS.map((dpi) => ({ value: dpi, label: `${dpi} dpi` }))}
        />
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 rounded-2xl" onClick={() => printerSettings.set({ x: 0, y: 0 })}>
            Reset
          </Button>
          <Button variant="default" className="h-11 flex-1 rounded-2xl" onClick={onTestPrint}>
            <Crosshair className="h-4 w-4" /> Print test label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
