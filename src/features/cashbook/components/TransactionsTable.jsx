import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatAmount } from "@/utils/formatters";
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
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recent transactions
      </h2>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No entries yet"
          description="Add one above, or import from a pasted chat."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                {HEADERS.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className={`px-3 py-2 font-medium ${header === "Amount" ? "text-right" : ""}`}
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
                  <tr key={transaction.id} className="hover:bg-surface/60">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {transaction.txn_date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {accountName(transaction.account_id)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums ${
                        isOutflow ? "text-destructive" : "text-success"
                      }`}
                    >
                      {isOutflow ? "-" : "+"}₹{formatAmount(Math.abs(transaction.amount))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs uppercase text-muted-foreground">
                      {transaction.type.replace("_", " ")}
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
