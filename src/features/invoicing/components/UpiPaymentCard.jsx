import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { upiLinkFor } from "../upi";

export function UpiPaymentCard({ amount, isVisible = true }) {
  if (!isVisible || !amount) return null;

  return (
    <Card className="mx-auto w-full max-w-sm bg-white p-4">
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="rounded-lg border-4 border-[#5f259f] p-2">
          <QRCodeSVG value={upiLinkFor(amount)} size={300} />
        </div>
        <p className="text-center text-base font-semibold md:text-lg">Scan to pay ₹{amount}</p>
        <p className="text-center text-xs text-gray-600 md:text-sm">
          Use any UPI app to scan and pay
        </p>
      </CardContent>
    </Card>
  );
}
