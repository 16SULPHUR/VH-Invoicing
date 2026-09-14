import { ChartNoAxesCombined, ReceiptText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { RecentInvoices } from "./RecentInvoices";
import { SalesSidebar } from "./SalesSidebar";

const drawerButtonClass = "fixed top-4 z-10 rounded-full bg-purple-500 p-1 text-white";

export function MobileInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;

  return (
    <div className="flex flex-1">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open sales information"
            className={`${drawerButtonClass} left-4`}
          >
            <ChartNoAxesCombined size={24} />
          </button>
        </SheetTrigger>
        <SheetContent className="bg-gray-900 p-0" side="left">
          <SheetHeader>
            <SheetTitle className="text-white">Sales Information</SheetTitle>
          </SheetHeader>
          <SalesSidebar dailySales={dailySales} sales={sales} />
        </SheetContent>
      </Sheet>

      <InvoiceWorkspace
        draft={draft}
        catalog={catalog}
        customers={customers}
        invoiceId={recentInvoices.nextInvoiceId}
        isOnline={isOnline}
        onSubmit={workspace.submitInvoice}
      />

      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open recent invoices"
            className={`${drawerButtonClass} right-4`}
          >
            <ReceiptText size={24} />
          </button>
        </SheetTrigger>
        <SheetContent className="bg-gray-900 p-0">
          <SheetHeader>
            <SheetTitle className="text-white">Recent Invoices</SheetTitle>
          </SheetHeader>
          <RecentInvoices
            invoices={recentInvoices.invoices}
            onInvoiceClick={workspace.openInvoice}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
