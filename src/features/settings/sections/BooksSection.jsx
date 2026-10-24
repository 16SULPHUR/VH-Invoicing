import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { OpeningBalances } from "@/features/books/components/OpeningBalances";
import { Section } from "../components/fields";

const TYPE_ORDER = ["asset", "liability", "equity", "revenue", "income", "expense"];

function Accounts() {
  const accounts = useQuery({ queryKey: queryKeys.books.accounts, queryFn: () => booksService.accounts(), staleTime: 10 * 60_000 });
  const rows = [...(accounts.data ?? [])].sort(
    (a, b) => TYPE_ORDER.indexOf(String(a.type).toLowerCase()) - TYPE_ORDER.indexOf(String(b.type).toLowerCase()) || String(a.code).localeCompare(String(b.code))
  );

  return (
    <Section title="Accounts" description="The accounts sales, payments, supplier bills and your entries are posted to. Set by the database, shown here for reference.">
      {accounts.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : accounts.error ? (
        <p className="text-sm text-destructive">{accounts.error.message}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {rows.map((account) => (
            <li key={account.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-12 font-mono text-xs text-muted-foreground">{account.code}</span>
              <span className="flex-1 font-semibold">{account.name}</span>
              <span className="text-xs capitalize text-muted-foreground">{account.type}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function BooksSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <Section title="Opening balances" description="What the shop held when these books begin. Set once.">
          <OpeningBalances />
        </Section>
        <Section title="Home & Shop" description="Cash kept at home and at the shop is tracked separately from the books.">
          <p className="text-sm">
            To correct a balance, use <b>Set counted amount</b> on the{" "}
            <Link to="/holdings" className="font-bold text-rani hover:underline">
              Home & Shop
            </Link>{" "}
            page. The name on entries is under Settings › This device.
          </p>
        </Section>
      </div>
      <Accounts />
    </div>
  );
}
