import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { TableSkeleton } from "@/components/common/Skeletons";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { useReportRange } from "@/features/reports/range/useReportRange";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatINR } from "@/utils/formatters";
import { EntryDialog } from "../components/EntryDialog";
import { referenceLabel } from "../lib/entryKinds";

export default function AccountBookPage({ title, subtitle, accounts, inLabel, outLabel, kinds, defaultKind, defaultSource }) {
  const { range } = useReportRange();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const book = useQuery({
    queryKey: queryKeys.books.account(accounts, range.from, range.to),
    queryFn: () => booksService.accountBook(accounts, range),
  });

  const remove = useMutation({
    mutationFn: (id) => booksService.deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      toast({ title: "Entry deleted" });
    },
    onError: (error) => toast({ title: "Could not delete", description: error.message, variant: "destructive" }),
  });

  const lines = book.data?.lines ?? [];
  const totalIn = lines.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
  const totalOut = lines.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button onClick={() => setAdding(true)} className="block-shadow press">
            <Plus size={16} className="mr-1.5" aria-hidden />
            New entry
          </Button>
        }
      />
      <EntryDialog open={adding} onOpenChange={setAdding} kinds={kinds} defaultKind={defaultKind} defaultSource={defaultSource} />

      {book.error && (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {book.error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Opening" value={formatINR(book.data?.opening)} />
        <StatTile label={inLabel} value={formatINR(totalIn)} accent="text-leaf" />
        <StatTile label={outLabel} value={formatINR(totalOut)} accent="text-rani" />
        <StatTile label="Closing" value={formatINR(book.data?.closing)} />
      </div>

      {book.isLoading && <TableSkeleton columns={6} />}
      {!book.isLoading && !book.error && lines.length === 0 && (
        <EmptyState title="Nothing in this period" description="Pick another range, or add an entry." />
      )}
      {lines.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-elevated hover:bg-surface-elevated">
                  <TableHead>Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">{inLabel}</TableHead>
                  <TableHead className="text-right">{outLabel}</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((row, index) => (
                  <TableRow key={`${row.transaction_id}-${index}`}>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDateDDMMMYYYY(row.date)}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{referenceLabel(row.reference_table)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.debit ? formatINR(row.debit) : ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.credit ? formatINR(row.credit) : ""}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatINR(row.balance)}</TableCell>
                    <TableCell>
                      {row.reference_table === "journal" && (
                        <button
                          type="button"
                          aria-label="Delete entry"
                          className="press text-muted-foreground hover:text-destructive"
                          onClick={() => window.confirm("Delete this entry?") && remove.mutate(row.transaction_id)}
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export const CashBookPage = () => (
  <AccountBookPage
    title="Cash book"
    subtitle="Every rupee in and out of the till"
    accounts={["Cash"]}
    inLabel="Received"
    outLabel="Paid"
    defaultKind="expense"
    defaultSource="Cash"
  />
);

export const BankBookPage = () => (
  <AccountBookPage
    title="Bank book"
    subtitle="UPI and bank movements"
    accounts={["Bank", "UPI"]}
    inLabel="Deposits"
    outLabel="Withdrawals"
    defaultKind="expense"
    defaultSource="Bank"
  />
);

export const ExpensesPage = () => (
  <AccountBookPage
    title="Expenses"
    subtitle="Shop spending, from cash or bank"
    accounts={["Expenses"]}
    inLabel="Spent"
    outLabel="Refunded"
    kinds={["expense"]}
    defaultKind="expense"
    defaultSource="Cash"
  />
);
