import { useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Monogram } from "@/components/common/Monogram";
import { PageLoader } from "@/components/common/PageLoader";
import { CustomerEditDialog } from "./CustomerEditDialog";
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from "../hooks/useCustomers";

function matches(customer, term) {
  if (!term) return true;
  const needle = term.toLowerCase();
  return [customer.name, customer.phone, customer.address].some((field) =>
    String(field ?? "")
      .toLowerCase()
      .includes(needle)
  );
}

export default function ManageCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { data: customers, isLoading } = useCustomers();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filtered = useMemo(
    () => customers.filter((customer) => matches(customer, searchTerm)),
    [customers, searchTerm]
  );

  const handleDelete = (customer) => {
    if (window.confirm(`Delete customer "${customer.name}"?`)) {
      deleteCustomer.mutate(customer.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="text"
          placeholder="Search by name, phone or address…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <PageLoader label="Loading customers…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
        <Table>
          <TableHeader className="bg-surface-elevated">
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Monogram name={customer.name} className="h-9 w-9 text-sm" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{customer.name}</div>
                      <div className="text-xs tabular-nums text-muted-foreground">
                        {customer.phone || "No phone"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {customer.address}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${customer.name}`}
                      onClick={() => setEditingCustomer(customer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${customer.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(customer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      <CustomerEditDialog
        open={editingCustomer !== null}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
        customer={editingCustomer}
        isSaving={updateCustomer.isPending}
        onChange={(field, value) =>
          setEditingCustomer((previous) => ({ ...previous, [field]: value }))
        }
        onSubmit={() =>
          updateCustomer.mutate(editingCustomer, { onSuccess: () => setEditingCustomer(null) })
        }
      />
    </div>
  );
}
