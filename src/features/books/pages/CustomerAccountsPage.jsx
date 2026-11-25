import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { TableSkeleton } from "@/components/common/Skeletons";
import { CustomerSheet } from "@/features/customers/components/CustomerSheet";
import { customerKey, invoiceCustomerKey, phoneDigits } from "@/features/customers/lib/customerKey";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { formatINR } from "@/utils/formatters";

function buildAccounts({ invoices, payments, customers }) {
  const accounts = new Map();
  const get = (key, name, phone) => {
    if (!accounts.has(key)) {
      accounts.set(key, { key, name: String(name ?? "").trim() || "Unnamed", phone: phoneDigits(phone), bills: 0, billed: 0, credit: 0, collected: 0 });
    }
    return accounts.get(key);
  };

  customers.forEach((customer) => get(customerKey(customer), customer.name, customer.phone));
  invoices.forEach((invoice) => {
    const account = get(invoiceCustomerKey(invoice), invoice.customerName, invoice.customerNumber);
    if (!account.phone) account.phone = phoneDigits(invoice.customerNumber);
    account.bills += 1;
    account.billed += Number(invoice.total) || 0;
    account.credit += Number(invoice.credit) || 0;
  });
  payments.forEach((payment) => {
    const account = get(customerKey({ name: payment.customer_name, phone: payment.customer_phone }), payment.customer_name, payment.customer_phone);
    account.collected += Number(payment.amount) || 0;
  });

  return [...accounts.values()]
    .map((account) => ({ ...account, balance: account.credit - account.collected }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

export default function CustomerAccountsPage() {
  const [search, setSearch] = useState("");
  const [onlyDue, setOnlyDue] = useState(false);
  const [open, setOpen] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.books.customers,
    queryFn: () => booksService.customerAccounts(),
  });

  const accounts = useMemo(() => (data ? buildAccounts(data) : []), [data]);
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return accounts.filter(
      (account) =>
        (!onlyDue || account.balance > 0) &&
        (!needle || account.name.toLowerCase().includes(needle) || account.phone.includes(needle))
    );
  }, [accounts, search, onlyDue]);

  const receivable = accounts.reduce((sum, account) => sum + Math.max(account.balance, 0), 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Customer accounts"
        subtitle="Every customer's bills, payments and what they owe"
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or phone…" aria-label="Search customers" className="pl-9" />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Customers" value={accounts.length} />
        <StatTile label="Owe the shop" value={formatINR(receivable)} accent="text-rani" />
        <StatTile label="With dues" value={accounts.filter((account) => account.balance > 0).length} />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={onlyDue} onChange={(event) => setOnlyDue(event.target.checked)} />
        Only customers who owe
      </label>

      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
      {isLoading && <TableSkeleton columns={5} />}
      {!isLoading && !error && shown.length === 0 && <EmptyState title="No customers found" />}
      {shown.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-elevated hover:bg-surface-elevated">
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Bills</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((account) => (
                  <TableRow key={account.key} className="cursor-pointer" onClick={() => setOpen({ name: account.name, phone: account.phone })}>
                    <TableCell className="font-semibold">{account.name}</TableCell>
                    <TableCell className="tabular-nums">{account.phone}</TableCell>
                    <TableCell className="text-right tabular-nums">{account.bills}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(account.billed)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${account.balance > 0 ? "text-rani" : ""}`}>
                      {formatINR(account.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CustomerSheet customer={open} initialTab="collect" onClose={() => setOpen(null)} />
    </div>
  );
}
