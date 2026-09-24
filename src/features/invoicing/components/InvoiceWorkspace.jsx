import { OfflineInvoiceBanner } from "@/components/common/OfflineInvoiceBanner";
import { CustomerDetails } from "./CustomerDetails";
import { InvoiceLineTable } from "./InvoiceLineTable";
import { ProductPicker } from "./ProductPicker";

function headerDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

/** The working half of the till: who is buying, and what. */
export function InvoiceWorkspace({ draft, catalog, customers, invoiceId, isOnline, actions, compact }) {
  const title = draft.isEditing ? "Edit bill" : "New bill";
  const subtitle = `#${invoiceId ?? "…"} · ${headerDate(draft.currentDate)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {compact ? (
        <header className="relative shrink-0 bg-indigo px-4 pb-4 pt-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
              <p className="truncate text-xs text-indigo-foreground tabular-nums">{subtitle}</p>
            </div>
            {actions}
          </div>
          <div className="motif-band absolute inset-x-0 -bottom-2.5 h-2.5" aria-hidden />
        </header>
      ) : (
        <header className="flex flex-wrap items-end justify-between gap-3 px-7 pt-6">
          <div>
            <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">{subtitle}</p>
          </div>
          {actions}
        </header>
      )}

      <div className={`flex flex-col gap-4 ${compact ? "px-4 pb-4 pt-6" : "px-7 pb-7 pt-5"}`}>
        {!isOnline && <OfflineInvoiceBanner />}

        <div className="rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
          <CustomerDetails
            customers={customers}
            customerName={draft.customerName}
            setCustomerName={draft.setCustomerName}
            customerNumber={draft.customerNumber}
            setCustomerNumber={draft.setCustomerNumber}
          />
        </div>

        <ProductPicker
          catalog={catalog}
          lineForm={draft.lineForm}
          setLineForm={draft.setLineForm}
          isEditingLine={draft.editingLineIndex !== null}
          onSubmit={draft.submitLineForm}
        />

        <InvoiceLineTable
          lines={draft.lines}
          onEdit={draft.startEditingLine}
          onDelete={draft.deleteLine}
          onChangeQuantity={draft.changeLineQuantity}
        />
      </div>
    </div>
  );
}
