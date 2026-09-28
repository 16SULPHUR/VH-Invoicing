import { useState } from "react";
import { DatabaseZap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountDisplayName } from "../balances";

const ENTRY_TYPES = [
  { value: "inflow", label: "Cash in", tone: "border-leaf bg-leaf/10 text-leaf" },
  { value: "outflow", label: "Cash out", tone: "border-destructive bg-destructive/10 text-destructive" },
  { value: "bank_deposit", label: "Bank deposit", tone: "border-indigo bg-indigo/10 text-indigo" },
  { value: "correction", label: "Correction", tone: "border-marigold bg-marigold/15 text-warning" },
];

const labelClass = "text-xs font-semibold text-muted-foreground";

export function QuickEntryForm({ accounts, onSubmit, isSubmitting }) {
  const [entry, setEntry] = useState({
    account: "HOME",
    type: "inflow",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const setValue = (field, value) => setEntry((previous) => ({ ...previous, [field]: value }));
  const setField = (field) => (event) => setValue(field, event.target.value);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(entry, () => setEntry((previous) => ({ ...previous, amount: "", note: "" })));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/70 bg-surface p-4">
      <div className="flex items-center gap-2 font-display text-lg font-bold">
        <DatabaseZap className="h-4 w-4 text-rani" /> Quick entry
      </div>

      <div role="radiogroup" aria-label="Entry type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ENTRY_TYPES.map(({ value, label, tone }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={entry.type === value}
            onClick={() => setValue("type", value)}
            className={`h-9 rounded-xl border-[1.5px] text-sm font-bold transition-colors ${
              entry.type === value ? tone : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="quickAccount">
            Account
          </Label>
          <Select value={entry.account} onValueChange={(value) => setValue("account", value)}>
            <SelectTrigger id="quickAccount">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.name}>
                  {accountDisplayName(account.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="quickDate">
            Date
          </Label>
          <Input id="quickDate" type="date" value={entry.date} onChange={setField("date")} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="quickAmount">
            Amount ₹
          </Label>
          <Input
            id="quickAmount"
            type="number"
            placeholder="0"
            value={entry.amount}
            onChange={setField("amount")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="quickNote">
            Note
          </Label>
          <Input
            id="quickNote"
            type="text"
            placeholder="Optional"
            value={entry.note}
            onChange={setField("note")}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || !entry.amount} className="press w-full">
        <Upload className="mr-2 h-4 w-4" /> Save entry
      </Button>
    </form>
  );
}
