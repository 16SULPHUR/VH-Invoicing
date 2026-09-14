import { useState } from "react";
import { BarChart3, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CheckoutPanel } from "./CheckoutPanel";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { RecentInvoices } from "./RecentInvoices";
import { SalesSidebar } from "./SalesSidebar";
import { formatAmount } from "@/utils/formatters";
import { ICON_STROKE } from "@/config/navigation";

export function MobileInvoicing({ workspace }) {
  const { draft, catalog, customers, dailySales, sales, recentInvoices, isOnline } = workspace;
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InvoiceWorkspace
        draft={draft}
        catalog={catalog}
        customers={customers}
        invoiceId={recentInvoices.nextInvoiceId}
        isOnline={isOnline}
      />

      {/* Running total and checkout stay pinned above the tab bar. */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface p-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="press shrink-0"
              aria-label="Sales summary"
            >
              <BarChart3 size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Sales summary</SheetTitle>
            </SheetHeader>
            <SalesSidebar dailySales={dailySales} sales={sales} />
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="press shrink-0"
              aria-label="Recent invoices"
            >
              <ReceiptText size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Recent invoices</SheetTitle>
            </SheetHeader>
            <RecentInvoices
              invoices={recentInvoices.invoices}
              onInvoiceClick={workspace.openInvoice}
            />
          </SheetContent>
        </Sheet>

        <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <SheetTrigger asChild>
            <Button className="press h-11 flex-1 justify-between text-base">
              <span>{draft.itemCount} items</span>
              <span className="font-semibold tabular-nums">₹{formatAmount(draft.total)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Checkout</SheetTitle>
            </SheetHeader>
            <CheckoutPanel
              draft={draft}
              onSubmit={() => {
                setCheckoutOpen(false);
                workspace.submitInvoice();
              }}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
