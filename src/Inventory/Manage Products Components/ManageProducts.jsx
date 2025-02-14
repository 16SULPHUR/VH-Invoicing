import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../supabaseClient";
import ProductTable from "./ProductTable";
import SupplierTable from "./SupplierTable";
import FiltersAndSorting from "./FiltersAndSorting";
import ImageUploadDialog from "./ImageUploadDialog";
import ImageGallery from "./ImageGallery";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showCostColumn, setShowCostColumn] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [modifiedExistingImages, setModifiedExistingImages] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products. Please try again.",
      });
    } else {
      setProducts(data);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch suppliers. Please try again.",
      });
    } else {
      setSuppliers(data);
    }
  };

  const getSupplier = (id) => suppliers.find((s) => s.id == id);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.barcode.toString().includes(productSearchTerm) ||
      getSupplier(product.supplier)
        ?.name.toLowerCase()
        .includes(productSearchTerm.toLowerCase());

    const matchesSupplier =
      selectedSupplier === "all" || product.supplier === selectedSupplier;

    return matchesSearch && matchesSupplier;
  });

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      supplier.code.toString().includes(supplierSearchTerm)
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-300 text-black">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <FiltersAndSorting
            productSearchTerm={productSearchTerm}
            setProductSearchTerm={setProductSearchTerm}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            suppliers={suppliers}
          />
          <div className="flex items-center space-x-2">
            <Label htmlFor="showCost" className="text-sky-400">
              Cost
            </Label>
            <Switch
              id="showCost"
              checked={showCostColumn}
              onCheckedChange={setShowCostColumn}
            />
          </div>
          <ProductTable
            products={filteredProducts}
            showCostColumn={showCostColumn}
            getSupplier={getSupplier}
            handleImageClick={(images) => {
              setSelectedImages(images);
              setIsImageDialogOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="suppliers">
          <Input
            placeholder="Search suppliers..."
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100 mb-4"
          />
          <SupplierTable
            suppliers={filteredSuppliers}
            handleSupplierEdit={(supplier) => {
              setEditingSupplier(supplier);
              setIsSupplierEditDialogOpen(true);
            }}
            handleSupplierDelete={handleSupplierDelete}
          />
        </TabsContent>
      </Tabs>

      <ImageUploadDialog
        isImageUploadDialogOpen={isImageUploadDialogOpen}
        setIsImageUploadDialogOpen={setIsImageUploadDialogOpen}
        selectedProduct={selectedProduct}
        imagePreviews={imagePreviews}
        handleImageChange={(e) => {
          const files = Array.from(e.target.files);
          setSelectedFiles((prev) => [...prev, ...files]);

          const newPreviews = files.map((file) => ({
            url: URL.createObjectURL(file),
            isNew: true,
            file: file,
          }));
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }}
        handleDiscardImage={(index) => {
          const preview = imagePreviews[index];

          if (preview.isNew) {
            URL.revokeObjectURL(preview.url);
            setSelectedFiles((prev) =>
              prev.filter(
                (_, i) => i !== selectedFiles.findIndex((f) => f === preview.file)
              )
            );
          } else {
            const updatedImages = [
              ...(modifiedExistingImages || selectedProduct.images),
            ];
            updatedImages.splice(index, 1);
            setModifiedExistingImages(updatedImages);
          }

          setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        }}
        handleImageUpload={handleImageUpload}
        fileInputRef={fileInputRef}
      />

      <ImageGallery
        selectedImages={selectedImages}
        handleOutsideClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsImageDialogOpen(false);
          }
        }}
        setIsImageDialogOpen={setIsImageDialogOpen}
      />
    </div>
  );
};

export default ManageProducts;