import { ChartNoAxesCombined } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { financialYearOptions } from "@/utils/date";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { RecentInvoices } from "./RecentInvoices";
import { SalesSidebar } from "./SalesSidebar";

export function DesktopInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={85}>
        <div className="flex flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open sales information"
                className="fixed left-4 top-4 z-10 rounded-full bg-purple-500 p-1 text-white"
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
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={15} maxSize={25}>
        <div className="w-full p-2">
          <label className="sr-only" htmlFor="financialYear">
            Financial year
          </label>
          <select
            id="financialYear"
            value={recentInvoices.financialYear}
            onChange={(event) => recentInvoices.setFinancialYear(event.target.value)}
            className="rounded-md border bg-gray-900 px-2 py-1 text-white"
          >
            {financialYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <RecentInvoices invoices={recentInvoices.invoices} onInvoiceClick={workspace.openInvoice} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
