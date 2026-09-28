import { useState } from "react";
import { DatabaseZap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountDisplayName } from "../balances";

const ENTRY_TYPES = [
  { value: "inflow", label: "Cash In" },
  { value: "outflow", label: "Cash Out" },
  { value: "bank_deposit", label: "Bank Deposit" },
  { value: "correction", label: "Correction" },
];

const selectClass = "w-full rounded border border-border bg-transparent px-2 py-1";

export function QuickEntryForm({ accounts, onSubmit, isSubmitting }) {
  const [entry, setEntry] = useState({
    account: "HOME",
    type: "inflow",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const setField = (field) => (event) =>
    setEntry((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(entry, () => setEntry((previous) => ({ ...previous, amount: "", note: "" })));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <DatabaseZap className="h-4 w-4" /> Quick entry
      </div>

      <div className="mb-2 grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs" htmlFor="quickAccount">
            Account
          </Label>
          <select
            id="quickAccount"
            value={entry.account}
            onChange={setField("account")}
            className={selectClass}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.name} className="bg-surface">
                {accountDisplayName(account.name)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs" htmlFor="quickDate">
            Date
          </Label>
          <Input id="quickDate" type="date" value={entry.date} onChange={setField("date")} />
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs" htmlFor="quickType">
            Type
          </Label>
          <select
            id="quickType"
            value={entry.type}
            onChange={setField("type")}
            className={selectClass}
          >
            {ENTRY_TYPES.map(({ value, label }) => (
              <option key={value} value={value} className="bg-surface">
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs" htmlFor="quickAmount">
            Amount (₹)
          </Label>
          <Input
            id="quickAmount"
            type="number"
            placeholder="0"
            value={entry.amount}
            onChange={setField("amount")}
          />
        </div>
      </div>

      <div className="mb-3">
        <Label className="text-xs" htmlFor="quickNote">
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

      <Button type="submit" disabled={isSubmitting || !entry.amount} className="press">
        <Upload className="mr-2 h-4 w-4" /> Save Entry
      </Button>
    </form>
  );
}
