import { useState } from "react";
import { Link } from "react-router-dom";
import { FileChartColumn, QrCode, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { UpiPaymentCard } from "./UpiPaymentCard";
import { ICON_STROKE } from "@/config/navigation";

const SHORTCUTS = [
  { to: "/cashbook", label: "Cashbook", icon: Wallet },
  { to: "/reports", label: "Reports", icon: FileChartColumn },
];

export function QuickActions() {
  const [qrAmount, setQrAmount] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SHORTCUTS.map(({ to, label, icon: Icon }) => (
        <Button key={to} asChild variant="outline" size="sm" className="press">
          <Link to={to}>
            <Icon size={15} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
            {label}
          </Link>
        </Button>
      ))}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="press">
            <QrCode size={15} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
            Payment QR
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment QR</DialogTitle>
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
                className="text-2xl font-semibold tabular-nums"
              />
            )}
          </Field>
          <UpiPaymentCard amount={qrAmount} isVisible={Boolean(qrAmount)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
