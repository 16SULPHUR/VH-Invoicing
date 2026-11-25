import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Monogram } from "@/components/common/Monogram";
import { Input } from "@/components/ui/input";

export function SupplierTable({ suppliers, onEdit, onDelete }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.code].some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(needle)
      )
    );
  }, [suppliers, search]);

  return (
    <>
      <Input
        placeholder="Search suppliers…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-3 max-w-md"
      />
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
      <Table>
        <TableHeader className="bg-surface-elevated">
          <TableRow className="hover:bg-transparent">
            <TableHead>Supplier</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No suppliers found.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Monogram name={supplier.name} className="h-9 w-9 text-sm" />
                  <span className="font-semibold">{supplier.name}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{supplier.code}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    onClick={() => onEdit(supplier)}
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${supplier.name}`}
                  >
                    <Pencil className="h-4 w-4 " />
                  </Button>
                  <Button
                    onClick={() => onDelete(supplier)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${supplier.name}`}
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
    </>
  );
}
