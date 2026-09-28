import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { useInvoiceEditor } from "../hooks/useInvoiceEditor";
import { useCustomerDirectory, useProductCatalog } from "../hooks/useInvoiceQueries";

export function InvoiceEditDialog({ invoice, onClose, onSaved }) {
  const { isOnline } = useOnlineStatus();
  const { data: catalog } = useProductCatalog();
  const { data: customers } = useCustomerDirectory();

  const { draft, save } = useInvoiceEditor({
    invoice,
    onSaved: () => {
      onSaved?.();
      onClose();
    },
  });

  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto bg-surface text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Edit Invoice</DialogTitle>
        </DialogHeader>

        {invoice && (
          <InvoiceWorkspace
            draft={draft}
            catalog={catalog}
            customers={customers}
            invoiceId={invoice.id}
            isOnline={isOnline}
            onSubmit={save}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
