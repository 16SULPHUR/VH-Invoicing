import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { CheckoutPanel } from "./CheckoutPanel";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { useInvoiceEditor } from "../hooks/useInvoiceEditor";
import { useCustomerDirectory, useProductCatalog } from "../hooks/useInvoiceQueries";

/** Full edit of a saved bill: customer, items, how it was paid and the note. */
export function InvoiceEditDialog({ invoice, onClose, onSaved }) {
  const { isOnline } = useOnlineStatus();
  const { data: catalog } = useProductCatalog();
  const { data: customers } = useCustomerDirectory();
  const [isSaving, setIsSaving] = useState(false);

  const { draft, save } = useInvoiceEditor({
    invoice,
    onSaved: () => {
      onSaved?.();
      onClose();
    },
  });

  const submit = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await save();
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, save]);

  useEffect(() => {
    if (!invoice) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "F1") return;
      event.preventDefault();
      submit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [invoice, submit]);

  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden bg-background p-0 sm:rounded-3xl">
        <DialogTitle className="sr-only">Edit bill #{invoice?.id}</DialogTitle>
        <DialogDescription className="sr-only">
          Change the customer, items, payment split or note of this bill.
        </DialogDescription>

        {invoice && (
          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1fr_360px] md:overflow-hidden">
            <InvoiceWorkspace
              draft={draft}
              catalog={catalog}
              customers={customers}
              invoiceId={invoice.id}
              isOnline={isOnline}
            />
            <CheckoutPanel
              draft={draft}
              onSubmit={submit}
              onCancelEdit={onClose}
              isSubmitting={isSaving}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
