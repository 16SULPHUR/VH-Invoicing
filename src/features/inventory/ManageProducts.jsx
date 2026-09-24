import { useState } from "react";
import { Filter, Search, TrendingUp } from "lucide-react";
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
import { PRODUCT_FIELDS, SUPPLIER_FIELDS, pickFields } from "./entityFields";
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
        <TabsList className="h-9 w-fit">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search products, supplier, barcode…"
                value={filters.search}
                onChange={(event) => filters.setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filters.supplierId} onValueChange={filters.setSupplierId}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label
              htmlFor="showCost"
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm font-semibold"
            >
              Show cost
              <Switch id="showCost" checked={showCost} onCheckedChange={setShowCost} />
            </Label>

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters((current) => !current)}
            >
              <Filter className="mr-1.5 h-4 w-4" /> Filters
            </Button>
            <Button
              variant={showAnalytics ? "default" : "outline"}
              onClick={() => setShowAnalytics((current) => !current)}
            >
              <TrendingUp className="mr-1.5 h-4 w-4" /> Analytics
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
            <div className="flex items-center gap-3 rounded-2xl bg-indigo px-4 py-2.5 text-white">
              <span className="text-sm font-semibold">
                {selection.selectedIds.size} selected
              </span>
              <Button variant="marigold" size="sm" className="ml-auto" onClick={() => setIsBatchDialogOpen(true)}>
                Edit selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-foreground hover:bg-indigo-raised hover:text-white"
                onClick={selection.clear}
              >
                Clear
              </Button>
            </div>
          )}

          <ProductTable
            products={filters.visibleProducts}
            showCost={showCost}
            selection={selection}
            supplierNameFor={filters.supplierNameFor}
            onQuantityCommit={(id, quantity) => updateProduct.mutate({ id, quantity })}
            rowActions={rowActions}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-3">
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
          updateProduct.mutate(pickFields(editingProduct, PRODUCT_FIELDS), {
            onSuccess: () => setEditingProduct(null),
          })
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
          updateSupplier.mutate(pickFields(editingSupplier, SUPPLIER_FIELDS), {
            onSuccess: () => setEditingSupplier(null),
          })
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
