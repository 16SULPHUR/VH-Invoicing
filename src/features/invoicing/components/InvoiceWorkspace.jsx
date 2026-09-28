import { OfflineInvoiceBanner } from "@/components/common/OfflineInvoiceBanner";
import { CustomerDetails } from "./CustomerDetails";
import { InvoiceLineTable } from "./InvoiceLineTable";
import { ProductPicker } from "./ProductPicker";
import { QuickActions } from "./QuickActions";
import { formatInvoiceHeaderDate } from "@/utils/date";

/** The working half of the till: who is buying, and what. */
export function InvoiceWorkspace({ draft, catalog, customers, invoiceId, isOnline }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">
            {draft.isEditing ? "Edit invoice" : "New invoice"}
          </h1>
          <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-sm font-medium tabular-nums text-muted-foreground">
            #{invoiceId ?? "-"}
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {formatInvoiceHeaderDate(draft.currentDate)}
          </span>
        </div>
        <QuickActions />
      </header>

      {!isOnline && <OfflineInvoiceBanner />}

      <CustomerDetails
        customers={customers}
        customerName={draft.customerName}
        setCustomerName={draft.setCustomerName}
        customerNumber={draft.customerNumber}
        setCustomerNumber={draft.setCustomerNumber}
      />

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
      />
    </div>
  );
}
