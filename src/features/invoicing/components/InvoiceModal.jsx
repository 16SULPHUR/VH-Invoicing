import { useState } from "react";
import { Edit, Printer, QrCode, Share2, Trash2, X } from "lucide-react";
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
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { useToast } from "@/hooks/use-toast";
import { parseInvoiceLines } from "@/utils/invoice";
import { PrintableInvoice } from "./PrintableInvoice";
import { UpiPaymentCard } from "./UpiPaymentCard";
import { usePrintDocument } from "../hooks/useInvoicePrinting";
import { useShareInvoicePdf } from "../hooks/useInvoiceSharing";

const TOTAL_TILES = [
  { key: "total", label: "🧾 Total", className: "text-pink-400" },
  { key: "cash", label: "💸 Cash", className: "text-green-400" },
  { key: "upi", label: "🏛️ UPI", className: "text-pink-400" },
  { key: "credit", label: "❌ Credit", className: "text-red-400" },
];

export function InvoiceModal({ invoice, onClose, onEdit, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const printDocument = usePrintDocument();
  const shareInvoicePdf = useShareInvoicePdf();
  const { toast } = useToast();

  if (!invoice) return null;

  const printable = (
    <PrintableInvoice
      invoiceId={invoice.id}
      invoiceDate={new Date(invoice.date).toLocaleDateString()}
      customerName={invoice.customerName}
      customerContact={invoice.customerNumber}
      products={parseInvoiceLines(invoice.products)}
      total={invoice.total}
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
        toast({
          title: "Share failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <div
        role="presentation"
        onClick={(event) => event.target === event.currentTarget && onClose()}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 text-black"
      >
        <div className="flex w-full max-w-full flex-col md:max-w-6xl md:flex-row md:space-x-4">
          <div className="flex w-full flex-col md:w-auto">
            {!showQRCode && (
              <Button
                onClick={() => setShowQRCode(true)}
                className="w-full bg-[#5f259f] text-white hover:bg-[#4a1d7a] md:w-auto"
              >
                <QrCode className="mr-2 h-4 w-4" /> Payment QR
              </Button>
            )}
            <UpiPaymentCard amount={invoice.total} isVisible={showQRCode} />
          </div>

          <div className="max-h-[60vh] w-full overflow-auto rounded-lg bg-white p-2 md:max-h-[80vh] md:w-2/3">
            {invoice._syncStatus && invoice._syncStatus !== "synced" && (
              <div className="mb-2 flex items-center justify-center p-2">
                <OfflineBadge syncStatus={invoice._syncStatus} />
              </div>
            )}
            {printable}
          </div>

          <div className="flex w-full flex-col-reverse space-y-2 md:w-auto md:flex-col">
            <div className="flex w-full flex-col space-y-2 md:w-auto">
              <Button variant="destructive" onClick={onClose} className="w-full md:w-auto">
                <X className="mr-2 h-4 w-4" /> Close
              </Button>
              <Button
                className="w-full rounded-md bg-green-500 text-white transition-colors hover:bg-green-600 md:w-auto"
                onClick={handleShare}
                disabled={isSharing}
              >
                <Share2 className="mr-2 h-4 w-4" /> {isSharing ? "Preparing…" : "Share"}
              </Button>
              <Button
                className="w-full rounded-md bg-pink-400 text-black transition-colors hover:bg-pink-500 md:w-auto"
                variant="secondary"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button
                className="w-full rounded-md bg-[#FFDD00] text-black transition-colors hover:bg-[#FFE033] md:w-auto"
                onClick={() => onEdit(invoice)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full md:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-1">
              {TOTAL_TILES.map(({ key, label, className }) => (
                <div key={key} className={`rounded bg-gray-800 p-2 ${className}`}>
                  <p className="text-sm font-medium">
                    {label} ₹{invoice[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This cannot be undone. It permanently deletes the invoice for &quot;
              {invoice.customerName}&quot; totalling ₹{invoice.total}, and returns its items to
              stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-100 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(invoice.date);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
