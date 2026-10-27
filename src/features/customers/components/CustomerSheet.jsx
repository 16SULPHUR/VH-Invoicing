import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monogram } from "@/components/common/Monogram";
import { PageLoader } from "@/components/common/PageLoader";
import { InvoiceEditDialog } from "@/features/invoicing/components/InvoiceEditDialog";
import { DuesReminderLink, OffersPill } from "@/features/whatsapp/components/CustomerWhatsApp";
import { formatRupees } from "@/utils/formatters";
import { daysSince, phoneDigits } from "../lib/customerKey";
import { refreshCustomerData, useCreditPayments, useCustomerInvoices } from "../hooks/useCreditPayments";
import { CollectPayment } from "./CollectPayment";
import { CustomerBills } from "./CustomerBills";
import { CustomerHistory } from "./CustomerHistory";

function Stat({ label, value, tone = "" }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-foreground">{label}</p>
      <p className={`truncate font-display text-lg font-extrabold tabular-nums leading-tight ${tone}`}>{value}</p>
    </div>
  );
}

/** One customer at a glance: what they owe, taking a payment, every bill and what happened when. */
export function CustomerSheet({ customer, initialTab = "collect", onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(initialTab);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const invoicesQuery = useCustomerInvoices(customer);
  const paymentsQuery = useCreditPayments(customer);
  const invoices = invoicesQuery.data;

  useEffect(() => setTab(initialTab), [customer, initialTab]);

  const creditBills = invoices.filter((invoice) => Number(invoice.credit) > 0);
  const due = creditBills.reduce((sum, invoice) => sum + (Number(invoice.credit) || 0), 0);
  const spent = invoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
  const lastVisit = invoices[0]?.date;
  const digits = phoneDigits(customer?.phone);
  const hasPhone = digits.length === 10;
  const name = String(customer?.name ?? "").trim() || "Unnamed";
  const loading = invoicesQuery.isLoading;
  const activeTab = tab === "collect" && due === 0 && !loading ? "bills" : tab;

  return (
    <Sheet open={customer !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l-0 p-0 sm:max-w-xl [&>button:first-child]:hidden"
      >
        <header className="motif-overlay relative shrink-0 bg-indigo px-5 pb-5 pt-4 text-white">
          <div className="relative flex items-start gap-3">
            <Monogram name={name} className="h-12 w-12 text-lg" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-2xl font-extrabold text-white">{name}</SheetTitle>
              <SheetDescription className="tabular-nums text-indigo-foreground">
                {hasPhone ? `${digits.slice(0, 5)} ${digits.slice(5)}` : "No phone saved"}
              </SheetDescription>
            </div>
            <SheetClose className="press -mr-1 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-3">
            <Stat label="Due" value={formatRupees(due)} tone={due > 0 ? "text-marigold" : ""} />
            <Stat label="Spent" value={formatRupees(spent)} />
            <Stat
              label="Last visit"
              value={lastVisit ? (daysSince(lastVisit) === 0 ? "Today" : `${daysSince(lastVisit)}d ago`) : "–"}
            />
          </div>

          {hasPhone && (
            <div className="relative mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${digits}`}
                className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-sm font-bold hover:bg-white/20"
              >
                <Phone className="h-4 w-4" aria-hidden /> Call
              </a>
              {due > 0 && <DuesReminderLink name={name} phone={digits} creditBills={creditBills} />}
              <OffersPill name={name} phone={digits} />
            </div>
          )}
          <div className="motif-band absolute inset-x-0 -bottom-2.5 h-2.5" aria-hidden />
        </header>

        <Tabs value={activeTab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-5 mt-6 w-fit shrink-0">
            {due > 0 && <TabsTrigger value="collect">Collect</TabsTrigger>}
            <TabsTrigger value="bills">Bills · {invoices.length}</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {loading ? (
            <PageLoader label="Loading bills…" />
          ) : (
            <>
              <TabsContent value="collect" className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4 data-[state=inactive]:hidden">
                <CollectPayment key={customer ? phoneDigits(customer.phone) || name : "none"} invoices={creditBills} />
              </TabsContent>
              <TabsContent value="bills" className="mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <CustomerBills invoices={invoices} onEdit={setEditingInvoice} />
              </TabsContent>
              <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <CustomerHistory
                  invoices={invoices}
                  payments={paymentsQuery.data}
                  paymentsError={paymentsQuery.error}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        <InvoiceEditDialog
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={() => refreshCustomerData(queryClient)}
        />
      </SheetContent>
    </Sheet>
  );
}
