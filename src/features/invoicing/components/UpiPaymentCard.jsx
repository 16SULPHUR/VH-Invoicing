import { QRCodeSVG } from "qrcode.react";
import { upiLinkFor } from "../upi";
import { formatRupees } from "@/utils/formatters";

export function UpiPaymentCard({ amount, isVisible = true }) {
  if (!isVisible || !amount) return null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-secondary p-4">
      {/* The QR needs a light quiet zone to scan reliably, so this block stays paper. */}
      <div className="paper rounded-xl p-3">
        <QRCodeSVG value={upiLinkFor(amount)} size={232} />
      </div>
      <p className="text-center font-display text-lg font-bold tabular-nums">
        Scan to pay {formatRupees(amount)}
      </p>
      <p className="text-center text-xs text-muted-foreground">Works with any UPI app</p>
    </div>
  );
}
