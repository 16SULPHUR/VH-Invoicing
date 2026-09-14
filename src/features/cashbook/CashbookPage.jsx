import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { TileSkeleton } from "@/components/common/Skeletons";
import { formatAmount } from "@/utils/formatters";
import { accountDisplayName } from "./balances";
import { useCashbook, useCashbookImport } from "./hooks/useCashbook";
import { QuickEntryForm } from "./components/QuickEntryForm";
import { ChatImportPanel } from "./components/ChatImportPanel";
import { TransactionsTable } from "./components/TransactionsTable";
import { ICON_STROKE } from "@/config/navigation";

export default function CashbookPage() {
  const cashbook = useCashbook();
  const chatImport = useCashbookImport(cashbook);

  const isBusy =
    cashbook.addEntry.isPending ||
    chatImport.buildPreview.isPending ||
    chatImport.runImport.isPending;

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader
        title="Cashbook"
        subtitle="Daily balances, deposits and corrections"
        actions={
          <Button
            variant="outline"
            size="icon"
            className="press"
            onClick={() => cashbook.refetch()}
            disabled={cashbook.isLoading}
            aria-label="Refresh cashbook"
          >
            <RefreshCw
              size={16}
              strokeWidth={ICON_STROKE}
              className={cashbook.isLoading ? "animate-spin" : ""}
              aria-hidden
            />
          </Button>
        }
      />

      {cashbook.isLoading ? (
        <TileSkeleton count={2} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cashbook.accounts.map((account) => (
              <StatTile
                key={account.id}
                label={accountDisplayName(account.name)}
                value={`₹${formatAmount(cashbook.balances[account.id])}`}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
