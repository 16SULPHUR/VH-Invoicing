import { QRCodeSVG } from "qrcode.react";
import { upiLinkFor } from "../upi";
import { formatAmount } from "@/utils/formatters";

export function UpiPaymentCard({ amount, isVisible = true }) {
  if (!isVisible || !amount) return null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border p-4">
      {/* The QR needs a light quiet zone to scan reliably, so this block stays paper. */}
      <div className="paper rounded-md p-3">
        <QRCodeSVG value={upiLinkFor(amount)} size={232} />
      </div>
      <p className="text-center text-base font-semibold tabular-nums">
        Scan to pay ₹{formatAmount(amount)}
      </p>
      <p className="text-center text-xs text-muted-foreground">Works with any UPI app</p>
    </div>
  );
}
