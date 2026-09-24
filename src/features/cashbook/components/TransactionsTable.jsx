import { ReceiptIndianRupee } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { accountDisplayName } from "../balances";

const HEADERS = ["Date", "Account", "Amount", "Type", "Note", "Author"];

function byMostRecent(a, b) {
  return b.txn_date.localeCompare(a.txn_date) || b.created_at.localeCompare(a.created_at);
}

export function TransactionsTable({ transactions, accounts }) {
  const accountName = (id) => {
    const account = accounts.find((candidate) => candidate.id === id);
    return account ? accountDisplayName(account.name) : id;
  };

  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Recent transactions</h2>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptIndianRupee}
          title="No entries yet"
          description="Add one above, or import from a pasted chat."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-surface">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {HEADERS.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className={`px-3 py-2.5 font-bold ${header === "Amount" ? "text-right" : ""}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...transactions].sort(byMostRecent).map((transaction) => {
                const isOutflow = Number(transaction.amount) < 0;
                return (
                  <tr key={transaction.id} className="hover:bg-accent/50">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {transaction.txn_date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {accountName(transaction.account_id)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right font-display text-[15px] font-bold tabular-nums ${
                        isOutflow ? "text-destructive" : "text-success"
                      }`}
                    >
                      {isOutflow ? "−" : "+"}{formatRupees(Math.abs(transaction.amount))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {transaction.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {transaction.description || "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{transaction.author || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
