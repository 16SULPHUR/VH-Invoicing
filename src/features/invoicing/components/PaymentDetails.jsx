import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "../paymentMethods";
import { ICON_STROKE } from "@/config/navigation";

export function PaymentDetails({ payments, setPayment, onAssignFullAmount }) {
  return (
    <div className="grid gap-2">
      {PAYMENT_METHODS.map(({ key, label, icon: Icon, text }) => (
        <div key={key} className="grid grid-cols-[auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={() => onAssignFullAmount(key)}
            title={`Put the full balance in ${label}`}
            aria-label={`Put the full balance in ${label}`}
            className={`press flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface transition-colors hover:bg-surface-elevated ${text}`}
          >
            <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
          <div className="grid grid-cols-[4rem_1fr] items-center gap-2">
            <Label htmlFor={`pay-${key}`} className="text-xs text-muted-foreground">
              {label}
            </Label>
            <Input
              id={`pay-${key}`}
              type="number"
              autoComplete="off"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={payments[key]}
              onChange={(event) => setPayment(key, event.target.value)}
              className="h-9 text-right tabular-nums"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
