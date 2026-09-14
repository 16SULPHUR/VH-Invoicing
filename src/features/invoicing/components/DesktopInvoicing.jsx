import { BarChart3, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { financialYearOptions } from "@/utils/date";
import { CheckoutPanel } from "./CheckoutPanel";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { RecentInvoices } from "./RecentInvoices";
import { SalesSidebar } from "./SalesSidebar";
import { ICON_STROKE } from "@/config/navigation";

export function DesktopInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;

  return (
    <div className="flex h-full min-h-0">
      <InvoiceWorkspace
        draft={draft}
        catalog={catalog}
        customers={customers}
        invoiceId={recentInvoices.nextInvoiceId}
        isOnline={isOnline}
      />

      <div className="hidden w-[22rem] shrink-0 lg:block">
        <CheckoutPanel draft={draft} onSubmit={workspace.submitInvoice} />
      </div>

      <div className="hidden w-[20rem] shrink-0 flex-col border-l border-border bg-surface xl:flex">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <label
            htmlFor="financial-year"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            Year
          </label>
          <select
            id="financial-year"
            value={recentInvoices.financialYear}
            onChange={(event) => recentInvoices.setFinancialYear(event.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {financialYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="press h-8 w-8"
                aria-label="Sales summary"
              >
                <BarChart3 size={15} strokeWidth={ICON_STROKE} aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle>Sales summary</SheetTitle>
              </SheetHeader>
              <SalesSidebar dailySales={dailySales} sales={sales} />
            </SheetContent>
          </Sheet>
        </div>

        <RecentInvoices invoices={recentInvoices.invoices} onInvoiceClick={workspace.openInvoice} />
      </div>

      {/* Below xl the checkout and invoice list move into sheets. */}
      <div className="flex shrink-0 flex-col gap-2 border-l border-border bg-surface p-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="press" aria-label="Checkout">
              <ReceiptText size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Checkout</SheetTitle>
            </SheetHeader>
            <CheckoutPanel draft={draft} onSubmit={workspace.submitInvoice} />
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="press" aria-label="Sales summary">
              <BarChart3 size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-md">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Sales summary</SheetTitle>
            </SheetHeader>
            <SalesSidebar dailySales={dailySales} sales={sales} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
