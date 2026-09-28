import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { QuickActions } from "./QuickActions";
import { RecentBillsButton } from "./RecentBills";
import { TotalBar } from "./TotalBar";

export function MobileInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InvoiceWorkspace
        compact
        draft={draft}
        catalog={catalog}
        customers={customers}
        invoiceId={workspace.displayedInvoiceId}
        isOnline={isOnline}
        actions={
          <div className="flex items-center gap-1.5">
            <QuickActions dailySales={dailySales} sales={sales} onDark />
            <RecentBillsButton
              recentInvoices={recentInvoices}
              onInvoiceClick={workspace.openInvoice}
              onDark
            />
          </div>
        }
      />

      <div className="shrink-0 px-3 pb-2 pt-1">
        <TotalBar
          draft={draft}
          onSubmit={workspace.submitInvoice}
          onCancelEdit={workspace.cancelEdit}
          isSubmitting={workspace.isSubmitting}
          className="w-full"
        />
      </div>
    </div>
  );
}
