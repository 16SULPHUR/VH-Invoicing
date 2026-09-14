import { useState } from "react";
import { Filter, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatchEditDialog } from "./components/BatchEditDialog";
import { EntityEditDialog } from "./components/EntityEditDialog";
import { PRODUCT_FIELDS, SUPPLIER_FIELDS } from "./entityFields";
import { ImageGalleryDialog } from "./components/ImageGalleryDialog";
import { ImageUploadDialog } from "./components/ImageUploadDialog";
import { InventoryAnalytics, StockAlerts } from "./components/InventoryAnalytics";
import { ProductFilterPanel } from "./components/ProductFilterPanel";
import { ProductTable } from "./components/ProductTable";
import { SupplierTable } from "./components/SupplierTable";
import { useBatchEdit } from "./hooks/useBatchEdit";
import {
  useDeleteProduct,
  useDeleteSupplier,
  useProducts,
  useSuppliers,
  useUpdateProduct,
  useUpdateSupplier,
} from "./hooks/useInventory";
import { useImageActions } from "./hooks/useProductImages";
import { useProductFilters, useProductSelection } from "./hooks/useProductFilters";

export default function ManageProducts() {
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();

  const filters = useProductFilters({ products, suppliers });
  const selection = useProductSelection(filters.visibleProducts);
  const imageActions = useImageActions();

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCost, setShowCost] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [galleryImages, setGalleryImages] = useState(null);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const batchEdit = useBatchEdit({
    products,
    selectedIds: selection.selectedIds,
    onDone: () => {
      selection.clear();
      setIsBatchDialogOpen(false);
    },
  });

  const confirmDelete = (label, name, onConfirm) => {
    if (window.confirm(`Delete ${label} "${name}"? This cannot be undone.`)) onConfirm();
  };

  const rowActions = {
    onEdit: setEditingProduct,
    onUploadImages: setUploadingFor,
    onViewImages: setGalleryImages,
    onShareImages: imageActions.shareImages,
    onDownloadImages: imageActions.downloadImages,
    onDelete: (product) =>
      confirmDelete("product", product.name, () => deleteProduct.mutate(product.id)),
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-300 text-black">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="mb-4 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters((current) => !current)}
              className="flex items-center gap-2 text-black"
            >
              <Filter className="h-4 w-4" /> {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAnalytics((current) => !current)}
              className="flex items-center gap-2 text-black"
            >
              <TrendingUp className="h-4 w-4" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
          </div>

          {showAnalytics && <InventoryAnalytics analytics={filters.analytics} />}
          <StockAlerts analytics={filters.analytics} />

          {showFilters && (
            <ProductFilterPanel
              filters={filters.draftFilters}
              setFilters={filters.setDraftFilters}
              onApply={filters.applyFilters}
            />
          )}

          {selection.selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {selection.selectedIds.size} items selected
              </span>
              <Button
                variant="outline"
                className="text-black"
                onClick={() => setIsBatchDialogOpen(true)}
              >
                Edit Selected
              </Button>
              <Button variant="outline" className="text-black" onClick={selection.clear}>
                Clear Selection
              </Button>
            </div>
          )}

          <Input
            placeholder="Search products, supplier, barcode..."
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
            className="border-gray-600 bg-gray-700 text-gray-100"
          />

          <div className="mb-4 mt-2 flex w-full items-center justify-around gap-5">
            <div className="flex items-center space-x-2">
              <Label htmlFor="showCost" className="text-pink-400">
                Cost
              </Label>
              <Switch id="showCost" checked={showCost} onCheckedChange={setShowCost} />
            </div>

            <Select value={filters.supplierId} onValueChange={filters.setSupplierId}>
              <SelectTrigger className="w-[200px] text-pink-400">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ProductTable
            products={filters.visibleProducts}
            showCost={showCost}
            selection={selection}
            supplierNameFor={filters.supplierNameFor}
            onQuantityCommit={(id, quantity) => updateProduct.mutate({ id, quantity })}
            rowActions={rowActions}
          />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierTable
            suppliers={suppliers}
            onEdit={setEditingSupplier}
            onDelete={(supplier) =>
              confirmDelete("supplier", supplier.name, () => deleteSupplier.mutate(supplier.id))
            }
          />
        </TabsContent>
      </Tabs>

      <EntityEditDialog
        title="Edit Product"
        fields={PRODUCT_FIELDS}
        entity={editingProduct}
        isSaving={updateProduct.isPending}
        onChange={(field, value) =>
          setEditingProduct((previous) => ({ ...previous, [field]: value }))
        }
        onSubmit={() =>
          updateProduct.mutate(editingProduct, { onSuccess: () => setEditingProduct(null) })
        }
        onClose={() => setEditingProduct(null)}
      />

      <EntityEditDialog
        title="Edit Supplier"
        fields={SUPPLIER_FIELDS}
        entity={editingSupplier}
        isSaving={updateSupplier.isPending}
        onChange={(field, value) =>
          setEditingSupplier((previous) => ({ ...previous, [field]: value }))
        }
        onSubmit={() =>
          updateSupplier.mutate(editingSupplier, { onSuccess: () => setEditingSupplier(null) })
        }
        onClose={() => setEditingSupplier(null)}
      />

      <ImageGalleryDialog images={galleryImages} onClose={() => setGalleryImages(null)} />

      {uploadingFor && (
        <ImageUploadDialog product={uploadingFor} onClose={() => setUploadingFor(null)} />
      )}

      <BatchEditDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        batchEditData={batchEdit.batchEditData}
        setField={batchEdit.setField}
        onApply={() => batchEdit.apply.mutate()}
        count={selection.selectedIds.size}
        isSaving={batchEdit.apply.isPending}
      />
    </div>
  );
}
