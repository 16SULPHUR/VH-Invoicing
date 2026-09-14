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
    <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 font-semibold text-pink-400">Recent transactions</div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className={`p-2 ${header === "Amount" ? "text-right" : "text-left"}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="p-4 text-center text-slate-400">
                  No entries yet
                </td>
              </tr>
            )}
            {[...transactions].sort(byMostRecent).map((transaction) => {
              const isOutflow = Number(transaction.amount) < 0;
              return (
                <tr key={transaction.id} className="border-b border-slate-800/60">
                  <td className="whitespace-nowrap p-2">{transaction.txn_date}</td>
                  <td className="whitespace-nowrap p-2">{accountName(transaction.account_id)}</td>
                  <td
                    className={`whitespace-nowrap p-2 text-right ${
                      isOutflow ? "text-red-300" : "text-green-300"
                    }`}
                  >
                    {isOutflow ? "-" : "+"}₹ {formatAmount(Math.abs(transaction.amount))}
                  </td>
                  <td className="whitespace-nowrap p-2 uppercase">{transaction.type}</td>
                  <td className="p-2">{transaction.description || "-"}</td>
                  <td className="p-2">{transaction.author || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
