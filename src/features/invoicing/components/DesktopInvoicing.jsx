import { CheckoutPanel } from "./CheckoutPanel";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { QuickActions } from "./QuickActions";
import { RecentBillsButton, RecentBillsStrip } from "./RecentBills";
import { TotalBar } from "./TotalBar";

export function DesktopInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <InvoiceWorkspace
          draft={draft}
          catalog={catalog}
          customers={customers}
          invoiceId={recentInvoices.nextInvoiceId}
          isOnline={isOnline}
          actions={
            <div className="flex items-center gap-2">
              <QuickActions dailySales={dailySales} sales={sales} />
              <div className="lg:hidden">
                <RecentBillsButton
                  recentInvoices={recentInvoices}
                  onInvoiceClick={workspace.openInvoice}
                />
              </div>
            </div>
          }
        />
        {/* Below lg the checkout column folds into a pinned total bar. */}
        <div className="shrink-0 p-4 pt-0 lg:hidden">
          <TotalBar draft={draft} onSubmit={workspace.submitInvoice} className="w-full" />
        </div>
      </div>

      <div className="hidden w-[22rem] shrink-0 lg:block">
        <CheckoutPanel draft={draft} onSubmit={workspace.submitInvoice}>
          <RecentBillsStrip recentInvoices={recentInvoices} onInvoiceClick={workspace.openInvoice} />
        </CheckoutPanel>
      </div>
    </div>
  );
}
