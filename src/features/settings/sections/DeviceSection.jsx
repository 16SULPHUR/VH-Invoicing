import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PushReminder } from "@/features/push/PushReminder";
import { usePrintStation } from "@/features/printing/usePrintStation";
import { NumberField, Segmented } from "@/features/inventory/stickers/designer/fields";
import { DPI_OPTIONS, printerSettings, usePrinterSettings } from "@/features/inventory/stickers/printerSettings";
import { useLabelPrinter } from "@/features/inventory/stickers/useLabelPrinter";
import { useLabelDesigns } from "@/features/inventory/stickers/useLabelDesigns";
import { useEnteredBy } from "@/features/books/useEnteredBy";
import { DeviceBadge, FieldLabel, Section } from "../components/fields";

function PhoneBills() {
  const station = usePrintStation();
  if (!station) return null;
  return (
    <Section title="Phone bills" description="Bills sent from the Scan screen on a phone are saved and printed on this computer." aside={<DeviceBadge />}>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3.5 py-3">
        <span>
          <span className="block text-sm font-semibold">Print phone bills here</span>
          <span className="text-xs text-muted-foreground">Turn this off on computers without the bill printer.</span>
        </span>
        <Switch checked={station.settings.enabled} onCheckedChange={(enabled) => station.updateSettings({ enabled })} />
      </label>
      {station.active && (
        <div className="space-y-1.5">
          <FieldLabel htmlFor="station-name">Name shown on the phone</FieldLabel>
          <Input id="station-name" value={station.settings.name} onChange={(event) => station.updateSettings({ name: event.target.value || "Till" })} />
        </div>
      )}
      {station.active && (
        <Button variant="outline" size="sm" onClick={station.testPrint}>
          Print a test bill
        </Button>
      )}
    </Section>
  );
}

function LabelPrinter() {
  const printer = usePrinterSettings();
  const { printTest } = useLabelPrinter();
  const { defaultDesign: design } = useLabelDesigns();

  return (
    <Section title="Sticker printer" description="Nudge the print into place. On a test label the box should sit on the label edge and the cross in its centre." aside={<DeviceBadge />}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Move right (mm)" step={0.1} min={-10} max={10} value={printer.x} onChange={(x) => printerSettings.set({ x })} />
        <NumberField label="Move down (mm)" step={0.1} min={-10} max={10} value={printer.y} onChange={(y) => printerSettings.set({ y })} />
      </div>
      <p className="text-xs text-muted-foreground">Negative moves left or up.</p>
      <Segmented
        label="Printer resolution"
        value={printer.dpi}
        onChange={(dpi) => printerSettings.set({ dpi })}
        options={DPI_OPTIONS.map((dpi) => ({ value: dpi, label: `${dpi} dpi` }))}
      />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => printerSettings.set({ x: 0, y: 0 })}>
          Reset
        </Button>
        <Button size="sm" disabled={!design} onClick={() => printTest(design.size)}>
          <Crosshair className="mr-1 h-4 w-4" aria-hidden /> Print test label
        </Button>
      </div>
    </Section>
  );
}

function EnteredBy() {
  const [name, setName] = useEnteredBy();
  return (
    <Section title="Your name" description="Filled in as “Entered by” on Books and Home & Shop entries from this device." aside={<DeviceBadge />}>
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ankit" aria-label="Your name" />
    </Section>
  );
}

export function DeviceSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <PhoneBills />
        <Section title="Reminders" aside={<DeviceBadge />}>
          <PushReminder />
        </Section>
        <EnteredBy />
      </div>
      <LabelPrinter />
    </div>
  );
}
