import { useState } from "react";
import { HandCoins, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PushReminder } from "@/features/push/PushReminder";
import { PageHeader } from "@/components/common/PageHeader";
import { TileSkeleton } from "@/components/common/Skeletons";
import { formatRupees } from "@/utils/formatters";
import { accountDisplayName } from "./balances";
import { useCashbook, useCashbookImport } from "./hooks/useCashbook";
import { QuickEntryForm } from "./components/QuickEntryForm";
import { ChatImportPanel } from "./components/ChatImportPanel";
import { HandoverDialog } from "./components/HandoverDialog";
import { PayoutDialog } from "./components/PayoutDialog";
import { HistoryTab } from "./components/HistoryTab";
import { MonthlyTab } from "./components/MonthlyTab";
import { ClosingBanner } from "./components/ClosingBanner";
import { TransactionsTable } from "./components/TransactionsTable";
import { ICON_STROKE } from "@/config/navigation";

const ACCOUNT_TONES = [
  "bg-leaf text-white",
  "bg-rani text-white",
  "bg-marigold text-marigold-foreground",
];

function accountTone(name, index) {
  return /bank/i.test(name) ? "bg-indigo text-white" : ACCOUNT_TONES[index % ACCOUNT_TONES.length];
}

export default function CashbookPage() {
  const cashbook = useCashbook();
  const chatImport = useCashbookImport(cashbook);
  const [closingDay, setClosingDay] = useState(false);
  const [payingOut, setPayingOut] = useState(false);

  const isBusy =
    cashbook.addEntry.isPending ||
    chatImport.buildPreview.isPending ||
    chatImport.runImport.isPending;

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader
        title="Cashbook"
        subtitle="Shop cash, cash taken home and Home payouts"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPayingOut(true)} className="press">
              <HandCoins size={16} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
              Pay out
            </Button>
            <Button onClick={() => setClosingDay(true)} className="block-shadow press">
              <Moon size={16} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
              Evening handover
            </Button>
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
          </div>
        }
      />

      <HandoverDialog open={closingDay} onOpenChange={setClosingDay} cashbook={cashbook} />
      <PayoutDialog open={payingOut} onOpenChange={setPayingOut} cashbook={cashbook} />

      {cashbook.isLoading ? (
        <TileSkeleton count={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {cashbook.accounts.map((account, index) => (
              <div
                key={account.id}
                className={`motif-overlay rounded-[1.25rem] px-4 py-3.5 sm:px-5 sm:py-4 ${accountTone(account.name, index)}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">
                  {accountDisplayName(account.name)}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold sm:text-[2.1rem] tabular-nums leading-none tracking-tight">
                  {formatRupees(cashbook.balances[account.id])}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {cashbook.accounts.map((account, index) => (
              <div
                key={account.id}
                className={`motif-overlay rounded-[1.25rem] px-4 py-3.5 sm:px-5 sm:py-4 ${accountTone(account.name, index)}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">
                  {accountDisplayName(account.name)}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold sm:text-[2.1rem] tabular-nums leading-none tracking-tight">
                  {formatRupees(cashbook.balances[account.id])}
                </p>
              </div>
            ))}
          </div>

          <ClosingBanner cashbook={cashbook} onClose={() => setClosingDay(true)} />

          <Tabs defaultValue="today" className="space-y-4">
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="space-y-4">
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

              <TransactionsTable
                transactions={cashbook.transactions}
                accounts={cashbook.accounts}
                onDelete={(id) => cashbook.deleteEntries.mutate({ transactionIds: [id] })}
              />
              <PushReminder />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTab cashbook={cashbook} />
            </TabsContent>
            <TabsContent value="monthly">
              <MonthlyTab cashbook={cashbook} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
