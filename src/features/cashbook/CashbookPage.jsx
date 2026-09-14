import { RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { formatAmount } from "@/utils/formatters";
import { accountDisplayName } from "./balances";
import { useCashbook, useCashbookImport } from "./hooks/useCashbook";
import { QuickEntryForm } from "./components/QuickEntryForm";
import { ChatImportPanel } from "./components/ChatImportPanel";
import { TransactionsTable } from "./components/TransactionsTable";

export default function CashbookPage() {
  const cashbook = useCashbook();
  const chatImport = useCashbookImport(cashbook);

  const isBusy =
    cashbook.addEntry.isPending ||
    chatImport.buildPreview.isPending ||
    chatImport.runImport.isPending;

  return (
    <div className="p-4 text-gray-100 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-pink-500 md:text-2xl">
          <Wallet className="h-6 w-6" /> Cashbook
        </h2>
        <Button
          variant="outline"
          className="bg-white text-black"
          onClick={() => cashbook.refetch()}
          disabled={cashbook.isLoading}
          aria-label="Refresh cashbook"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {cashbook.isLoading ? (
        <PageLoader label="Loading cashbook…" />
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {cashbook.accounts.map((account) => (
              <div key={account.id} className="rounded border border-slate-700 bg-slate-900/60 p-4">
                <div className="text-sm text-slate-400">{accountDisplayName(account.name)}</div>
                <div className="text-2xl font-bold text-pink-400">
                  ₹ {formatAmount(cashbook.balances[account.id])}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <QuickEntryForm
              accounts={cashbook.accounts}
              isSubmitting={cashbook.addEntry.isPending}
              onSubmit={(entry, reset) => cashbook.addEntry.mutate(entry, { onSuccess: reset })}
            />
            <ChatImportPanel
              preview={chatImport.preview}
              isBusy={isBusy}
              onPreview={(text) => chatImport.buildPreview.mutate(text)}
              onImport={(reset) => chatImport.runImport.mutate(undefined, { onSuccess: reset })}
            />
          </div>

          <TransactionsTable transactions={cashbook.transactions} accounts={cashbook.accounts} />
        </>
      )}
    </div>
  );
}
