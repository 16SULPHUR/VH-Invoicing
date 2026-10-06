import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localISODate } from "@/utils/date";
import { shiftISODate } from "../balances";

const REMIND_FROM_HOUR = 20;

export function ClosingBanner({ cashbook, onClose }) {
  const shopId = cashbook.accountIdByName("SHOP");
  const tomorrow = shiftISODate(localISODate(), 1);
  const closed = cashbook.reconciliations.some(
    (row) => row.account_id === shopId && row.as_of_date === tomorrow
  );
  if (!shopId || closed || new Date().getHours() < REMIND_FROM_HOUR) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-marigold/15 px-4 py-3">
      <p className="text-sm font-bold text-warning">Today isn&apos;t closed yet.</p>
      <Button size="sm" className="press shrink-0" onClick={onClose}>
        <Moon size={14} className="mr-1.5" aria-hidden /> Close now
      </Button>
    </div>
  );
}
