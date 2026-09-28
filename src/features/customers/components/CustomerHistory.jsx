import { Banknote, ReceiptText, Smartphone } from "lucide-react";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { isMissingTable } from "../hooks/useCreditPayments";

function toEvents(invoices, payments) {
  const bills = invoices.map((invoice) => ({
    kind: "bill",
    id: `bill-${invoice.date}`,
    when: invoice.date,
    invoice,
  }));
  const paid = payments.map((payment) => ({
    kind: "payment",
    id: `pay-${payment.id}`,
    when: `${payment.paid_on}T23:59:59`,
    payment,
  }));
  return [...bills, ...paid].sort((a, b) => String(b.when).localeCompare(String(a.when)));
}

function Dot({ className, children }) {
  return (
    <span className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-background ${className}`}>
      {children}
    </span>
  );
}

export function CustomerHistory({ invoices, payments, paymentsError }) {
  const events = toEvents(invoices, payments);

  return (
    <div className="space-y-3">
      {isMissingTable(paymentsError) && (
        <p className="rounded-2xl bg-marigold/15 px-3.5 py-2.5 text-sm text-warning">
          Payments collected here will show once the payments table is set up in Supabase.
        </p>
      )}
      <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:border-l-[1.5px] before:border-dashed before:border-border">
        {events.map((event) =>
          event.kind === "bill" ? (
            <li key={event.id} className="flex items-start gap-3">
              <Dot className="bg-indigo text-white">
                <ReceiptText className="h-4 w-4" aria-hidden />
              </Dot>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm">
                  <b>Bill #{event.invoice.id}</b> for {formatRupees(event.invoice.total)}
                  {Number(event.invoice.credit) > 0 && (
                    <span className="text-credit"> · {formatRupees(event.invoice.credit)} still due</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateDDMMMYYYY(event.invoice.date)}</p>
              </div>
            </li>
          ) : (
            <li key={event.id} className="flex items-start gap-3">
              <Dot className={event.payment.method === "upi" ? "bg-upi text-white" : "bg-cash text-white"}>
                {event.payment.method === "upi" ? (
                  <Smartphone className="h-4 w-4" aria-hidden />
                ) : (
                  <Banknote className="h-4 w-4" aria-hidden />
                )}
              </Dot>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm">
                  <b className="text-success">Paid {formatRupees(event.payment.amount)}</b>{" "}
                  {event.payment.method === "upi" ? "by UPI" : "in cash"} against #{event.payment.invoice_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateDDMMMYYYY(event.payment.paid_on)}
                  {event.payment.note && ` · ${event.payment.note}`}
                </p>
              </div>
            </li>
          )
        )}
      </ol>
    </div>
  );
}
