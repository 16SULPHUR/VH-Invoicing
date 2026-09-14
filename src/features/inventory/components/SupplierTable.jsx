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
        placeholder="Search suppliers..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 border-gray-600 bg-gray-700 text-gray-100"
      />
      <Table>
        <TableHeader>
          <TableRow>
            {["Name", "Code", "Actions"].map((header) => (
              <TableHead key={header} className="text-pink-400">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-400">
                No suppliers found.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((supplier) => (
            <TableRow key={supplier.id} className="text-white">
              <TableCell>{supplier.name}</TableCell>
              <TableCell>{supplier.code}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onEdit(supplier)}
                    variant="outline"
                    size="sm"
                    aria-label={`Edit ${supplier.name}`}
                  >
                    <Pencil className="h-4 w-4 text-black" />
                  </Button>
                  <Button
                    onClick={() => onDelete(supplier)}
                    variant="destructive"
                    size="sm"
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
    </>
  );
}
