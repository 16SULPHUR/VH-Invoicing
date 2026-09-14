import { FilePen, FilePlus2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineInvoiceBanner } from "@/components/common/OfflineInvoiceBanner";
import { SyncStatusBar } from "@/components/common/SyncStatusBar";
import { CustomerDetails } from "./CustomerDetails";
import { InvoiceDetails } from "./InvoiceDetails";
import { InvoiceLineTable } from "./InvoiceLineTable";
import { NoteField } from "./NoteField";
import { PaymentDetails } from "./PaymentDetails";
import { ProductPicker } from "./ProductPicker";
import { QuickActions } from "./QuickActions";

// The left padding clears the drawer trigger both layouts pin to the top-left corner.
export function InvoiceWorkspace({ draft, catalog, customers, invoiceId, isOnline, onSubmit }) {
  return (
    <div className="flex-grow overflow-auto bg-gray-900 p-3 pl-14 text-gray-100 md:p-6 md:pl-16">
      <div className="mb-4 flex items-center justify-between">
        <h5 className="rounded border border-pink-600 bg-pink-600 p-1.5 text-lg font-bold text-white md:text-xl">
          Create Invoice
        </h5>
        <div className="hidden items-center gap-3 md:flex">
          <SyncStatusBar />
          <Button className="hidden lg:block" onClick={() => window.location.reload()}>
            <RefreshCw />
          </Button>
        </div>
      </div>

      {!isOnline && <OfflineInvoiceBanner />}

      <QuickActions />

      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:gap-6">
        <CustomerDetails
          customers={customers}
          customerName={draft.customerName}
          setCustomerName={draft.setCustomerName}
          customerNumber={draft.customerNumber}
          setCustomerNumber={draft.setCustomerNumber}
        />
        <InvoiceDetails invoiceId={invoiceId} currentDate={draft.currentDate} />
      </div>

      <h5 className="mb-2 text-lg font-semibold text-pink-500">
        {draft.editingLineIndex !== null ? "Edit Item" : "Add Item"}
      </h5>

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

      <div className="flex justify-end gap-10">
        <div className="text-right text-lg font-bold text-pink-500 md:text-3xl">
          {draft.itemCount} Items
        </div>
        <div className="text-right text-lg font-bold text-pink-500 md:text-xl">
          Total: ₹ {draft.total}
        </div>
      </div>

      <PaymentDetails
        payments={draft.payments}
        setPayment={draft.setPayment}
        onAssignFullAmount={draft.assignFullAmountTo}
      />

      <NoteField note={draft.note} setNote={draft.setNote} />

      <div className="sticky bottom-16 right-4 mt-5 text-right md:bottom-8 md:right-10">
        <button
          type="button"
          onClick={onSubmit}
          className={`cursor-pointer rounded-md px-4 py-2 text-sm text-white transition-colors md:text-base ${
            draft.isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          <div className="flex items-center gap-2">
            {draft.isEditing ? (
              <>
                <FilePen className="h-4 w-4 md:h-5 md:w-5" /> Update Invoice
              </>
            ) : (
              <>
                <FilePlus2 className="h-4 w-4 md:h-5 md:w-5" /> Generate Invoice
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
