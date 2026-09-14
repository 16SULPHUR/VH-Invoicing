import { useState } from "react";
import { Link } from "react-router-dom";
import { FileChartColumn, QrCode, UserRoundXIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UpiPaymentCard } from "./UpiPaymentCard";

const SHORTCUTS = [
  {
    to: "/cashbook",
    label: "Cashbook",
    icon: Wallet,
    className: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FileChartColumn,
    className: "bg-green-600 hover:bg-green-700 text-white border-gray-600",
  },
  {
    to: "/customers",
    label: "Credit",
    icon: UserRoundXIcon,
    className: "bg-red-500 hover:bg-red-700 text-white",
  },
];

export function QuickActions() {
  const [qrAmount, setQrAmount] = useState("");

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
      {SHORTCUTS.map(({ to, label, icon: Icon, className }) => (
        <Button key={to} asChild className={className}>
          <Link to={to}>
            <Icon className="mr-2 h-4 w-4" /> {label}
          </Link>
        </Button>
      ))}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-white text-black">
            <QrCode className="mr-2 h-4 w-4" /> Create QR
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <Input
            id="qrAmount"
            type="number"
            value={qrAmount}
            onChange={(event) => setQrAmount(event.target.value)}
            placeholder="Enter amount"
            className="text-3xl font-bold"
          />
          <UpiPaymentCard amount={qrAmount} isVisible={Boolean(qrAmount)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
