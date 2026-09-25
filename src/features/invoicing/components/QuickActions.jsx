import { useState } from "react";
import { BarChart3, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { formatRupees } from "@/utils/formatters";
import { UpiPaymentCard } from "./UpiPaymentCard";
import { SalesSidebar } from "./SalesSidebar";
import { ICON_STROKE } from "@/config/navigation";

const chip =
  "press inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3.5 text-[13px] font-bold transition-colors";

export function QuickActions({ dailySales, sales, onDark = false }) {
  const [qrAmount, setQrAmount] = useState("");
  const collected = sales?.todayCollections ?? {};
  const today = (Number(collected.cash) || 0) + (Number(collected.upi) || 0) + (Number(collected.credit) || 0);

  return (
    <div className="flex items-center gap-2">
      {sales && (
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`${chip} ${
                onDark
                  ? "border-white/25 text-white hover:bg-white/10"
                  : "border-border bg-surface hover:border-input"
              }`}
            >
              <BarChart3 size={15} strokeWidth={ICON_STROKE} aria-hidden />
              <span className={onDark ? "sr-only sm:not-sr-only" : ""}>Today</span>
              <span className="tabular-nums">{formatRupees(today)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-md">
            <SheetHeader className="px-5 pb-1 pt-5 text-left">
              <SheetTitle className="font-display text-2xl font-extrabold">Sales</SheetTitle>
            </SheetHeader>
            <SalesSidebar dailySales={dailySales} sales={sales} />
          </SheetContent>
        </Sheet>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={`${chip} border-marigold bg-marigold text-marigold-foreground hover:bg-marigold/90`}
          >
            <QrCode size={15} strokeWidth={ICON_STROKE} aria-hidden />
            UPI QR
          </button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold">UPI QR</DialogTitle>
          </DialogHeader>
          <Field label="Amount" htmlFor="qr-amount">
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min="0"
                value={qrAmount}
                onChange={(event) => setQrAmount(event.target.value)}
                className="h-14 font-display text-3xl font-bold tabular-nums"
              />
            )}
          </Field>
          <UpiPaymentCard amount={qrAmount} isVisible={Boolean(qrAmount)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
