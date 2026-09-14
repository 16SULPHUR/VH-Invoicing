import { CloudOff } from "lucide-react";
import { ICON_STROKE } from "@/config/navigation";

const CAVEATS = [
  "The invoice number is temporary and changes after sync",
  "Stock levels may be out of date",
  "Do not clear browser data before syncing",
];

export function OfflineInvoiceBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3"
    >
      <CloudOff
        size={18}
        strokeWidth={ICON_STROKE}
        className="mt-0.5 shrink-0 text-warning"
        aria-hidden
      />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-warning">Working offline</p>
        <ul className="mt-1 space-y-0.5 text-xs text-warning/90">
          {CAVEATS.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
