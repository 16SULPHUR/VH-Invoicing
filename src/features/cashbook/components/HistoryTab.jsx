import { useMemo, useState } from "react";
import { Copy, History, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { buildHistory, discordLine } from "../history";

const PAGE = 31;

function Stat({ label, value, tone = "" }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className={`font-display text-lg font-extrabold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export function HistoryTab({ cashbook }) {
  const { toast } = useToast();
  const [shown, setShown] = useState(PAGE);
  const rows = useMemo(
    () =>
      buildHistory({
        accounts: cashbook.accounts,
        transactions: cashbook.transactions,
        reconciliations: cashbook.reconciliations,
      }),
    [cashbook.accounts, cashbook.transactions, cashbook.reconciliations]
  );

  const copy = async (row) => {
    try {
      await navigator.clipboard.writeText(discordLine(row));
      toast({ title: "Copied", description: "Paste it in Discord." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const undo = (row) => {
    const label = formatDateDDMMMYYYY(row.date);
    if (
      !window.confirm(
        `Undo the ${label} handover? Cash taken home and the shop count for that day are removed.`
      )
    )
      return;
    cashbook.deleteEntries.mutate({
      transactionIds: row.handoverIds,
      reconciliationId: row.reconId,
    });
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No days yet"
        description="Close the first day with Evening handover, or import the Discord chat."
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, shown).map((row) => {
        const off = row.difference !== null && Math.abs(row.difference) >= 1;
        return (
          <article key={row.date} className="rounded-2xl border border-border/70 bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold">{formatDateDDMMMYYYY(row.date)}</h3>
              <div className="flex items-center gap-2">
                {row.difference !== null && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      off ? "bg-marigold/15 text-warning" : "bg-success/10 text-success"
                    }`}
                  >
                    {off
                      ? `${formatRupees(Math.abs(row.difference))} ${row.difference > 0 ? "extra" : "short"}`
                      : "Matched"}
                  </span>
                )}
                {row.by && <span className="text-xs text-muted-foreground">by {row.by}</span>}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Left in shop"
                value={row.shopLeft === null ? "-" : formatRupees(row.shopLeft)}
              />
              <Stat label="Brought home" value={formatRupees(row.brought)} />
              <Stat
                label="Paid out"
                value={formatRupees(row.paid)}
                tone={row.paid ? "text-destructive" : ""}
              />
              <Stat label="Home balance" value={formatRupees(row.homeAfter)} />
            </div>

            {row.payouts.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {row.payouts.map((payout) => (
                  <li key={payout.id} className="flex justify-between gap-3">
                    <span>
                      {payout.label}
                      {payout.detail ? ` · ${payout.detail}` : ""}
                    </span>
                    <span className="tabular-nums">−{formatRupees(payout.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="press" onClick={() => copy(row)}>
                <Copy size={14} className="mr-1.5" aria-hidden /> Copy for Discord
              </Button>
              {(row.reconId || row.handoverIds.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="press"
                  onClick={() => undo(row)}
                  disabled={cashbook.deleteEntries.isPending}
                >
                  <Undo2 size={14} className="mr-1.5" aria-hidden /> Undo close
                </Button>
              )}
            </div>
          </article>
        );
      })}
      {shown < rows.length && (
        <Button variant="outline" className="w-full" onClick={() => setShown(shown + PAGE)}>
          Show older days
        </Button>
      )}
    </div>
  );
}
