import { useState } from "react";
import { Pencil, Printer, QrCode, Share2, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { parseInvoiceLines } from "@/utils/invoice";
import { PAYMENT_METHODS } from "../paymentMethods";
import { PrintableInvoice } from "./PrintableInvoice";
import { UpiPaymentCard } from "./UpiPaymentCard";
import { usePrintDocument } from "../hooks/useInvoicePrinting";
import { useShareInvoicePdf } from "../hooks/useInvoiceSharing";
import { ICON_STROKE } from "@/config/navigation";
import { formatInvoiceDate } from "@/utils/date";

export function InvoiceModal({ invoice, onClose, onEdit, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const printDocument = usePrintDocument();
  const shareInvoicePdf = useShareInvoicePdf();
  const { toast } = useToast();

  if (!invoice) return null;

  const printable = (
    <PrintableInvoice
      invoiceId={invoice.id}
      invoiceDate={formatInvoiceDate(invoice.date)}
      customerName={invoice.customerName}
      customerContact={invoice.customerNumber}
      products={parseInvoiceLines(invoice.products)}
      total={invoice.total}
      payments={invoice}
      note={invoice.note}
    />
  );

  const handlePrint = () => {
    if (!printDocument(printable)) {
      toast({
        title: "Print blocked",
        description: "Allow pop-ups for this site to print invoices.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareInvoicePdf(invoice);
    } catch (error) {
      if (error.name !== "AbortError") {
        toast({ title: "Share failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[92dvh] max-w-5xl overflow-y-auto p-0">
          <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border p-4">
            <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
              Bill #{invoice.id}
              {invoice._syncStatus && invoice._syncStatus !== "synced" && (
                <OfflineBadge syncStatus={invoice._syncStatus} />
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_16rem]">
            <div className="max-h-[68dvh] overflow-auto rounded-2xl bg-secondary p-4">{printable}</div>

            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <div className="motif-overlay col-span-2 rounded-2xl bg-rani px-4 py-3 text-white lg:col-span-1">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">Total</dt>
                  <dd className="font-display text-3xl font-extrabold tabular-nums">
                    {formatRupees(invoice.total)}
                  </dd>
                </div>
                {PAYMENT_METHODS.map(({ key, label, icon: Icon, text }) => (
                  <div key={key} className="rounded-xl border border-border/70 bg-surface px-3 py-2">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon size={13} strokeWidth={ICON_STROKE} className={text} aria-hidden />
                      {label}
                    </dt>
                    <dd className={`font-display text-lg font-bold tabular-nums ${text}`}>
                      {formatRupees(invoice[key])}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="grid gap-2">
                <Button variant="outline" className="press" onClick={() => setShowQR((v) => !v)}>
                  <QrCode size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  {showQR ? "Hide QR" : "Payment QR"}
                </Button>
                <Button
                  variant="outline"
                  className="press"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  {isSharing ? "Preparing…" : "Share PDF"}
                </Button>
                <Button variant="outline" className="press" onClick={handlePrint}>
                  <Printer size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  Print
                </Button>
                <Button variant="rani" className="press" onClick={() => onEdit(invoice)}>
                  <Pencil size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="press text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  Delete
                </Button>
                <Button variant="ghost" className="press" onClick={onClose}>
                  <X size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                  Close
                </Button>
              </div>

              {showQR && <UpiPaymentCard amount={invoice.total} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice #{invoice.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The invoice for {invoice.customerName || "this customer"},
              totalling {formatRupees(invoice.total)}, is removed and its items return to stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(invoice.date);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
