import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SupplierEditDialog = ({
  isSupplierEditDialogOpen,
  setIsSupplierEditDialogOpen,
  editingSupplier,
  setEditingSupplier,
  handleSupplierUpdate,
}) => {
  return (
    <Dialog open={isSupplierEditDialogOpen} onOpenChange={setIsSupplierEditDialogOpen}>
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        {editingSupplier && (
          <form onSubmit={handleSupplierUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName" className="text-pink-400">
                Supplier Name:
              </Label>
              <Input
                id="supplierName"
                value={editingSupplier.name}
                onChange={(e) =>
                  setEditingSupplier({
                    ...editingSupplier,
                    name: e.target.value,
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierCode" className="text-pink-400">
                Supplier Code:
              </Label>
              <Input
                id="supplierCode"
                value={editingSupplier.code}
                onChange={(e) =>
                  setEditingSupplier({
                    ...editingSupplier,
                    code: e.target.value,
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-600 text-white"
            >
              Update Supplier
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupplierEditDialog;