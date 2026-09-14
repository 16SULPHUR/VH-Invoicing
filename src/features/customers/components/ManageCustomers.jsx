import { useMemo, useState } from "react";
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
      <Input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <PageLoader label="Loading customers…" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Address", "Phone", "Actions"].map((header) => (
                <TableHead key={header} className="text-pink-400">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCustomer(customer)}
                    className="mr-2 text-black"
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(customer)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
