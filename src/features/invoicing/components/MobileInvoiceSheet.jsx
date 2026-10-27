import { useMemo, useState } from "react";
import {
  ChevronDown,
  Link2,
  MonitorSmartphone,
  Pencil,
  Printer,
  QrCode,
  Share2,
  Trash2,
} from "lucide-react";
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
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { useToast } from "@/hooks/use-toast";
import { ICON_STROKE } from "@/config/navigation";
import { formatRupees } from "@/utils/formatters";
import { formatInvoiceDate } from "@/utils/date";
import { parseInvoiceLines } from "@/utils/invoice";
import { RemotePrintStatus } from "@/features/printing/RemotePrintStatus";
import { REPRINT_KEY, usePhonePrint } from "@/features/scanner/hooks/usePhonePrint";
import { BillWhatsAppButton, OffersSwitch } from "@/features/whatsapp/components/BillWhatsApp";
import { useWhatsAppSettings } from "@/features/whatsapp/hooks/useWhatsApp";
import { appOrigin } from "@/features/whatsapp/lib/rules";
import { usedPaymentMethods } from "../paymentMethods";
import { BillSummary } from "./BillSummary";
import { PrintableInvoice } from "./PrintableInvoice";
import { ScaledBill } from "./ScaledBill";
import { UpiPaymentCard } from "./UpiPaymentCard";
import { usePrintDocument } from "../hooks/useInvoicePrinting";
import { useShareInvoicePdf } from "../hooks/useInvoiceSharing";
import { useBillLink } from "../hooks/useBillLink";
import { billShareText } from "../billShareText";

function Tile({ icon: Icon, label, onClick, disabled, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`press flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-bold disabled:opacity-50 ${
        active ? "border-rani bg-rani/10 text-rani" : "border-border bg-surface"
      }`}
    >
      <Icon size={20} strokeWidth={ICON_STROKE} aria-hidden />
      {label}
    </button>
  );
}

export function MobileInvoiceSheet({ invoice, onClose, onEdit, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const printDocument = usePrintDocument();
  const shareInvoicePdf = useShareInvoicePdf();
  const remote = usePhonePrint({ storageKey: REPRINT_KEY, legacy: false });
  const { toast } = useToast();
  const { rules } = useWhatsAppSettings();
  const link = useBillLink(invoice, appOrigin(rules));

  const lines = useMemo(() => parseInvoiceLines(invoice?.products), [invoice?.products]);
  if (!invoice) return null;

  const trackingThis = remote.job?.invoice_id === invoice.id;
  const remoteJob = trackingThis ? remote : { ...remote, job: null };
  const remoteBusy = remote.isSending || (trackingThis && remote.isOpen);
  const methods = usedPaymentMethods(invoice);

  const printable = (
    <PrintableInvoice
      invoiceId={invoice.id}
      invoiceDate={formatInvoiceDate(invoice.date)}
      customerName={invoice.customerName}
      customerContact={invoice.customerNumber}
      products={lines}
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

  const handleRemotePrint = async () => {
    if (invoice._syncStatus && invoice._syncStatus !== "synced") {
      toast({
        title: "Not saved yet",
        description: "This bill is still waiting to sync. Remote print it once it has.",
        variant: "destructive",
      });
      return;
    }
    await remote.send(null, { reprint: invoice });
  };

  const shareFailed = (error) =>
    error.name !== "AbortError" &&
    toast({ title: "Share failed", description: error.message, variant: "destructive" });

  const handleSharePdf = async () => {
    setIsSharing(true);
    try {
      await shareInvoicePdf(invoice, link);
    } catch (error) {
      shareFailed(error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareLink = async () => {
    const text = billShareText(invoice, link);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bill #${invoice.id}`, text });
      } catch (error) {
        shareFailed(error);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Bill link copied", description: link });
    } catch {
      toast({ title: "Couldn't copy", description: link, variant: "destructive" });
    }
  };

  return (
    <>
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="max-h-[94dvh] space-y-4 overflow-y-auto rounded-t-3xl p-4 pb-6"
        >
          <div className="pr-14">
            <SheetTitle className="flex items-center gap-2 text-2xl font-extrabold">
              Bill #{invoice.id}
              {invoice._syncStatus && invoice._syncStatus !== "synced" && (
                <OfflineBadge syncStatus={invoice._syncStatus} />
              )}
            </SheetTitle>
            <SheetDescription className="truncate">
              {invoice.customerName || "Walk-in"}
              {invoice.customerNumber ? ` · ${invoice.customerNumber}` : ""} ·{" "}
              {formatInvoiceDate(invoice.date)}
            </SheetDescription>
          </div>

          <div className="motif-overlay rounded-2xl bg-rani px-4 py-3 text-white">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">
                  Total · {lines.length} {lines.length === 1 ? "item" : "items"}
                </div>
                <div className="font-display text-3xl font-extrabold tabular-nums">
                  {formatRupees(invoice.total)}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {methods.map(({ key, label, icon: Icon }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tabular-nums"
                  >
                    <Icon size={12} strokeWidth={ICON_STROKE} aria-hidden />
                    {label} {formatRupees(invoice[key])}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="press h-12 font-bold" onClick={handlePrint}>
                <Printer size={18} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                Print
              </Button>
              <Button
                variant="rani"
                className="press block-shadow h-12 font-bold"
                onClick={handleRemotePrint}
                disabled={remoteBusy}
              >
                <MonitorSmartphone size={18} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
                Remote print
              </Button>
            </div>
            <RemotePrintStatus print={remoteJob} invoiceId={invoice.id} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <BillWhatsAppButton invoice={invoice} className="col-span-3 h-11" />
            {link && (
              <Tile
                icon={Link2}
                label={navigator.share ? "Share link" : "Copy link"}
                onClick={handleShareLink}
              />
            )}
            <Tile
              icon={Share2}
              label={isSharing ? "Preparing…" : "PDF"}
              onClick={handleSharePdf}
              disabled={isSharing}
            />
            <Tile
              icon={QrCode}
              label="Pay QR"
              onClick={() => setShowQR((value) => !value)}
              active={showQR}
            />
          </div>

          {showQR && <UpiPaymentCard amount={invoice.total} />}

          <OffersSwitch name={invoice.customerName} phone={invoice.customerNumber} />

          <BillSummary lines={lines} invoice={invoice} />

          <div>
            <button
              type="button"
              onClick={() => setShowBill((value) => !value)}
              className="press flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold"
              aria-expanded={showBill}
            >
              Paper copy
              <ChevronDown
                size={18}
                strokeWidth={ICON_STROKE}
                className={`transition-transform ${showBill ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {showBill && (
              <div className="mt-2">
                <ScaledBill>{printable}</ScaledBill>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button variant="outline" className="press h-11 font-bold" onClick={() => onEdit(invoice)}>
              <Pencil size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
              Edit bill
            </Button>
            <Button
              variant="ghost"
              className="press h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDelete(true)}
              aria-label="Delete bill"
            >
              <Trash2 size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
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
                setShowDelete(false);
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
