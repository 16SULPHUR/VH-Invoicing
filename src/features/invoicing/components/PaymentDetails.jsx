import { PAYMENT_METHODS } from "../paymentMethods";

export function PaymentDetails({ payments, setPayment, onAssignFullAmount }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PAYMENT_METHODS.map(({ key, label, text, tint }) => {
        const filled = Number(payments[key]) > 0;
        return (
          <div
            key={key}
            className={`rounded-2xl border-[1.5px] px-2.5 pb-1.5 pt-2 transition-colors focus-within:border-rani/50 ${
              filled ? `${tint} ${text}` : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <label
                htmlFor={`pay-${key}`}
                className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {label}
              </label>
              <button
                type="button"
                onClick={() => onAssignFullAmount(key)}
                title={`Put the full amount in ${label}`}
                className="press text-[11px] font-bold text-rani hover:underline"
              >
                Full
              </button>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold opacity-70">₹</span>
              <input
                id={`pay-${key}`}
                type="number"
                autoComplete="off"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={payments[key]}
                onChange={(event) => setPayment(key, event.target.value)}
                onDoubleClick={() => onAssignFullAmount(key)}
                className="w-full min-w-0 bg-transparent font-display text-lg font-bold tabular-nums outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
