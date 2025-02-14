import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProductEditDialog = ({
  isProductEditDialogOpen,
  setIsProductEditDialogOpen,
  editingProduct,
  setEditingProduct,
  handleProductUpdate,
}) => {
  return (
    <Dialog open={isProductEditDialogOpen} onOpenChange={setIsProductEditDialogOpen}>
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        {editingProduct && (
          <form onSubmit={handleProductUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sky-400">
                Product Name:
              </Label>
              <Input
                id="name"
                value={editingProduct.name}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    name: e.target.value,
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sky-400">
                Quantity:
              </Label>
              <Input
                id="quantity"
                type="number"
                value={editingProduct.quantity}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    quantity: parseInt(e.target.value),
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sky-400">
                Cost:
              </Label>
              <Input
                id="cost"
                type="number"
                value={editingProduct.cost}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    cost: parseFloat(e.target.value),
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-sky-400">
                Selling Price:
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                value={editingProduct.sellingPrice}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    sellingPrice: parseFloat(e.target.value),
                  })
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
            >
              Update Product
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;