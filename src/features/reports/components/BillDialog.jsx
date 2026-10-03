import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dayYearLabel, rupees } from "../lib/format";

const KIND_LABEL = { return: "Return", adjustment: "Not a sale" };

export function BillDialog({ bill, onClose }) {
  return (
    <Dialog open={Boolean(bill)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {bill && (
          <>
            <DialogHeader>
              <DialogTitle>Bill {bill.id}</DialogTitle>
              <DialogDescription>
                {dayYearLabel(bill.date)} · {bill.customerName || "Walk-in"} {bill.customerPhone && `· ${bill.customerPhone}`}
              </DialogDescription>
            </DialogHeader>
            <ul className="divide-y divide-border text-sm">
              {bill.lines.map((line, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.quantity} × {rupees(line.price)}
                      {line.cost != null && ` · cost ${rupees(line.cost)}`}
                      {KIND_LABEL[line.kind] && <span className="ml-1.5 rounded-full bg-marigold/25 px-1.5 py-0.5 font-bold text-warning">{KIND_LABEL[line.kind]}</span>}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums">{rupees(line.amount)}</span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-4 gap-2 rounded-xl bg-muted/60 p-3 text-center text-xs">
              {[["Total", bill.total], ["Cash", bill.cash], ["UPI", bill.upi], ["Credit", bill.credit]].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-bold tabular-nums">{rupees(value)}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
