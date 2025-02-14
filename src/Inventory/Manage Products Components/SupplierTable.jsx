import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const SupplierTable = ({ suppliers, handleSupplierEdit, handleSupplierDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-sky-400">Name</TableHead>
          <TableHead className="text-sky-400">Code</TableHead>
          <TableHead className="text-sky-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id} className="text-white">
            <TableCell>{supplier.name}</TableCell>
            <TableCell>{supplier.code}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleSupplierEdit(supplier)}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="h-4 w-4 text-black" />
                </Button>
                <Button
                  onClick={() => handleSupplierDelete(supplier.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SupplierTable;