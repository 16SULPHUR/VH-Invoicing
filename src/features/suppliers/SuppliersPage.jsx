import { useState } from "react";
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { TileSkeleton } from "@/components/common/Skeletons";
import { PushReminder } from "@/features/push/PushReminder";
import { useTabParam } from "@/hooks/useTabParam";
import { formatRupees } from "@/utils/formatters";
import { ICON_STROKE } from "@/config/navigation";
import { DUE_SOON_DAYS, round2 } from "./lib/billMath";
import { useSupplierBooks } from "./hooks/useSupplierBooks";
import { BillsTab } from "./components/BillsTab";
import { BillSheet } from "./components/BillSheet";
import { BillEditor } from "./components/BillEditor";
import { PayDialog } from "./components/PayDialog";
import { SuppliersTab } from "./components/SuppliersTab";

function SetupNotice({ onRetry }) {
  return (
    <div className="mx-auto max-w-xl space-y-3 rounded-2xl border-[1.5px] border-marigold/60 bg-marigold/10 p-5">
      <h2 className="font-display text-xl font-bold">One-time setup needed</h2>
      <p className="text-sm">
        Supplier bills need new tables in the database. Back up first, then run <code className="rounded bg-surface px-1">docs/schema/supplier_invoices.sql</code> in the Supabase SQL editor.
      </p>
      <Button variant="outline" onClick={onRetry}>I&apos;ve run it, check again</Button>
    </div>
  );
}

export default function SuppliersPage() {
  const books = useSupplierBooks();
  const [tab, setTab] = useTabParam("bills");
  const [openBillId, setOpenBillId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [pay, setPay] = useState(null);

  if (books.checking) return <div className="p-4"><TileSkeleton count={4} /></div>;
  if (!books.ready) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 p-4">
        <PageHeader title="Suppliers" subtitle="Purchase bills, dues and payments" />
        <SetupNotice onRetry={books.refetch} />
      </div>
    );
  }

  const open = books.bills.filter((bill) => bill.status !== "paid");
  const overdue = open.filter((bill) => bill.status === "overdue");
  const soon = open.filter((bill) => bill.daysLeft >= 0 && bill.daysLeft <= DUE_SOON_DAYS);
  const sum = (list) => round2(list.reduce((total, bill) => total + bill.outstanding, 0));
  const openBill = books.bills.find((bill) => bill.id === openBillId);

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader
        title="Suppliers"
        subtitle="Purchase bills, dues and payments"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="press" onClick={() => setPay({ kind: "payment" })}>
              <Wallet size={16} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden /> Pay
            </Button>
            <Button className="block-shadow press" onClick={() => setEditor({})}>
              <Plus size={16} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden /> Add bill
            </Button>
          </div>
        }
      />

      {books.isLoading ? (
        <TileSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile label="Total owed" value={formatRupees(sum(open))} hint={`${open.length} unpaid bill${open.length === 1 ? "" : "s"}`} className="col-span-2 md:col-span-1" />
          <StatTile label="Overdue" value={formatRupees(sum(overdue))} accent={overdue.length ? "text-destructive" : undefined} hint={`${overdue.length} bill${overdue.length === 1 ? "" : "s"}`} />
          <StatTile label={`Due in ${DUE_SOON_DAYS} days`} value={formatRupees(sum(soon))} hint={`${soon.length} bill${soon.length === 1 ? "" : "s"}`} />
        </div>
      )}

      {overdue.length > 0 && (
        <button
          type="button"
          onClick={() => setOpenBillId(overdue.sort((a, b) => a.due_date.localeCompare(b.due_date))[0].id)}
          className="press flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 text-left text-sm font-semibold text-destructive"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {overdue.length} bill{overdue.length === 1 ? " is" : "s are"} past the due date. Open the oldest.
        </button>
      )}

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList className="w-fit justify-start">
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="bills" className="min-h-0 flex-1 overflow-y-auto">
          <BillsTab bills={books.bills} suppliers={books.suppliers} supplierById={books.supplierById} onOpen={setOpenBillId} />
        </TabsContent>
        <TabsContent value="suppliers" className="min-h-0 flex-1 overflow-y-auto">
          <SuppliersTab
            suppliers={books.suppliers}
            bills={books.bills}
            onOpenBill={setOpenBillId}
            onPay={(supplierId) => setPay({ kind: "payment", supplierId })}
            onAddBill={(supplierId) => setEditor({ supplierId })}
          />
        </TabsContent>
      </Tabs>

      <PushReminder />

      {openBill && !editor && !pay && (
        <BillSheet
          bill={openBill}
          supplier={books.supplierById.get(String(openBill.supplier_id))}
          onClose={() => setOpenBillId(null)}
          onEdit={() => setEditor({ bill: openBill })}
          onPay={(kind) => setPay({ kind, billId: openBill.id })}
        />
      )}
      <BillEditor
        open={Boolean(editor)}
        bill={editor?.bill}
        defaultSupplierId={editor?.supplierId}
        bills={books.bills}
        suppliers={books.suppliers}
        supplierById={books.supplierById}
        onClose={() => setEditor(null)}
      />
      <PayDialog
        open={Boolean(pay)}
        onClose={() => setPay(null)}
        kind={pay?.kind}
        billId={pay?.billId}
        supplierId={pay?.supplierId}
        bills={books.bills}
        suppliers={books.suppliers}
        supplierById={books.supplierById}
      />
    </div>
  );
}
