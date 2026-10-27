import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { stickerQueue } from "./stickers/stickerQueue";
import { ProductDetailsFields } from "./components/ProductDetailsFields";
import { cleanAttributes, hasAttributesColumn } from "./productAttributes";
import { useToast } from "@/hooks/use-toast";
import { useShopSettings } from "@/features/settings/useShopSettings";

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
  const { toast } = useToast();
  const { settings } = useShopSettings();
  const attributesAvailable = hasAttributesColumn(products);

  /** Stock added to an existing product gets stickers for just the new pieces. */
  const queueNewStock = (additions) => {
    const pieces = additions.filter(({ count }) => count > 0);
    if (pieces.length === 0) return;
    stickerQueue.addPieces(pieces);
    const total = pieces.reduce((sum, { count }) => sum + count, 0);
    toast({ title: `${total} sticker${total === 1 ? "" : "s"} queued for the new stock`, description: "Print them from the Stickers tab." });
  };
  const addedStock = (id, quantity) => {
    const before = products.find((product) => product.id === id)?.quantity;
    return { id, count: (Number(quantity) || 0) - (Number(before) || 0) };
  };

  const batchEdit = useBatchEdit({
    products,
    selectedIds: selection.selectedIds,
    onDone: (additions) => {
      selection.clear();
      setIsBatchDialogOpen(false);
      queueNewStock(additions);
    },
  });

  const [, setSearchParams] = useSearchParams();
  const queueStickers = (items) => {
    stickerQueue.add(items.map((product) => ({ id: product.id, count: product.quantity })));
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        params.set("tab", "stickers");
        return params;
      },
      { replace: true }
    );
  };

  const confirmDelete = (label, name, onConfirm) => {
    if (window.confirm(`Delete ${label} "${name}"? This cannot be undone.`)) onConfirm();
  };

  const rowActions = {
    onEdit: setEditingProduct,
    onUploadImages: setUploadingFor,
    onViewImages: setGalleryImages,
    onShareImages: imageActions.shareImages,
    onDownloadImages: imageActions.downloadImages,
    onPrintStickers: (product) => queueStickers([product]),
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
          <StockAlerts
            analytics={filters.analytics}
            stockLevel={filters.stockLevel}
            onChange={filters.setStockLevel}
          />

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
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-white hover:bg-indigo-raised hover:text-white"
                onClick={() => {
                  queueStickers(products.filter((product) => selection.selectedIds.has(product.id)));
                  selection.clear();
                }}
              >
                Print stickers
              </Button>
              <Button variant="marigold" size="sm" onClick={() => setIsBatchDialogOpen(true)}>
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
            onQuantityCommit={(id, quantity) => {
              const addition = addedStock(id, quantity);
              updateProduct.mutate({ id, quantity }, { onSuccess: () => queueNewStock([addition]) });
            }}
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
        onSubmit={() => {
          const changes = pickFields(editingProduct, PRODUCT_FIELDS);
          if (attributesAvailable) changes.attributes = cleanAttributes(editingProduct.attributes);
          const addition = addedStock(editingProduct.id, changes.quantity);
          updateProduct.mutate(changes, {
            onSuccess: () => {
              setEditingProduct(null);
              queueNewStock([addition]);
            },
          });
        }}
        onClose={() => setEditingProduct(null)}
      >
        <ProductDetailsFields
          fields={settings.product_fields}
          value={editingProduct?.attributes}
          available={attributesAvailable}
          idPrefix="edit-detail"
          onChange={(attributes) => setEditingProduct((previous) => ({ ...previous, attributes }))}
        />
      </EntityEditDialog>

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
