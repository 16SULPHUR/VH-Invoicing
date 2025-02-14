import React, { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  MoreVertical,
  ImageIcon,
  Share2,
  Download,
  Upload,
  X,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Filter,
  Check,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import JSZip from "jszip";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { LazyLoadImage } from "react-lazy-load-image-component";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isProductEditDialogOpen, setIsProductEditDialogOpen] = useState(false);
  const [isSupplierEditDialogOpen, setIsSupplierEditDialogOpen] =
    useState(false);
  const [showCostColumn, setShowCostColumn] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const { toast } = useToast();

  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [modifiedExistingImages, setModifiedExistingImages] = useState(null);
  const fileInputRef = useRef(null);

  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out
  const [profitMarginFilter, setProfitMarginFilter] = useState("all"); // all, low, high
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    sellingPrice: { value: "", type: "fixed" }, // type can be "fixed" or "percentage"
    cost: { value: "", type: "fixed" },
    quantity: { value: "", type: "fixed" },
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, []);

  useEffect(() => {
    if (!isImageUploadDialogOpen) {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setImagePreviews([]);
      setSelectedFiles([]);
      setModifiedExistingImages(null);
    }
  }, [isImageUploadDialogOpen]);

  useEffect(() => {
    if (selectedProduct && isImageUploadDialogOpen) {
      // Initialize previews with existing images when dialog opens
      const existingPreviews = (selectedProduct.images || []).map((url) => ({
        url,
        isNew: false,
      }));
      setImagePreviews(existingPreviews);
    }
  }, [selectedProduct, isImageUploadDialogOpen]);

  const sanitizeFileName = (name) => {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  };

  const handleImageClick = (images) => {
    setSelectedImages(images);
    setIsImageDialogOpen(true);
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsImageDialogOpen(false); // Close the dialog when clicking outside
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      isNew: true,
      file: file,
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDiscardImage = (index) => {
    const preview = imagePreviews[index];

    if (preview.isNew) {
      // If it's a new image, revoke the object URL
      URL.revokeObjectURL(preview.url);
      // Remove the file from selectedFiles
      setSelectedFiles((prev) =>
        prev.filter(
          (_, i) => i !== selectedFiles.findIndex((f) => f === preview.file)
        )
      );
    } else {
      // If it's an existing image, update modifiedExistingImages
      const updatedImages = [
        ...(modifiedExistingImages || selectedProduct.images),
      ];
      updatedImages.splice(index, 1);
      setModifiedExistingImages(updatedImages);
    }

    // Remove the preview
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProductImages = async (images) => {
    const { error } = await supabase
      .from("products")
      .update({ images })
      .eq("id", selectedProduct.id);

    if (error) {
      console.error("Error updating product images:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product images. Please try again.",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Images updated successfully.",
    });
    await fetchProducts();
    return true;
  };

  const handleSaveExistingImages = async () => {
    if (!selectedProduct || !modifiedExistingImages) return;

    const success = await updateProductImages(modifiedExistingImages);
    if (success) {
      setModifiedExistingImages(null);
    }
  };

  const uploadImages = async () => {
    const uploadedImageUrls = [];
    for (const image of selectedFiles) {
      const formData = new FormData();
      formData.append("file", image);

      try {
        const response = await axios.post(
          "https://media.varietyheaven.in/upload.php",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        uploadedImageUrls.push(response.data.url);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload image. Please try again.",
        });
        return null;
      }
    }
    return uploadedImageUrls;
  };

  const handleImageUpload = async () => {
    if (!selectedProduct) return;

    // Filter new files that need to be uploaded
    const newFiles = imagePreviews
      .filter((preview) => preview.isNew)
      .map((preview) => preview.file);

    if (newFiles.length > 0) {
      const uploadedImageUrls = await uploadImages(newFiles);
      if (!uploadedImageUrls) return;

      // Get existing images that weren't removed
      const remainingExistingImages = imagePreviews
        .filter((preview) => !preview.isNew)
        .map((preview) => preview.url);

      // Combine remaining existing images with new uploaded URLs
      const updatedImages = [...remainingExistingImages, ...uploadedImageUrls];

      const success = await updateProductImages(updatedImages);
      if (success) {
        setIsImageUploadDialogOpen(false);
        setSelectedFiles([]);
        // Revoke all object URLs
        imagePreviews
          .filter((preview) => preview.isNew)
          .forEach((preview) => URL.revokeObjectURL(preview.url));
        setImagePreviews([]);
        setModifiedExistingImages(null);
      }
    } else if (modifiedExistingImages) {
      // If only existing images were modified
      const success = await updateProductImages(modifiedExistingImages);
      if (success) {
        setIsImageUploadDialogOpen(false);
        setImagePreviews([]);
        setModifiedExistingImages(null);
      }
    }
  };

  const openImageUploadDialog = (product) => {
    setSelectedProduct(product);
    setIsImageUploadDialogOpen(true);
    setSelectedFiles([]);
    setImagePreviews([]);
    setModifiedExistingImages(null);
  };

  const handleShareImages = async (images, productName) => {
    try {
      // First check if the Web Share API is available
      if (!navigator.share) {
        throw new Error("Web Share API not supported");
      }

      // For mobile devices that support image sharing
      if (navigator.canShare) {
        const files = await Promise.all(
          images.map(async (imageUrl) => {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new File(
              [blob],
              `${productName}-${Math.random().toString(36).substring(7)}.${
                blob.type.split("/")[1]
              }`,
              { type: blob.type }
            );
          })
        );

        const shareData = {
          files,
          title: `${productName} Images`,
          text: `Images of ${productName}`,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback for devices that don't support file sharing
      await navigator.share({
        title: `${productName} Images`,
        text: `Check out these images of ${productName}`,
        url: images[0], // Share at least the first image URL
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      // Create a fallback mechanism to copy links to clipboard
      try {
        await navigator.clipboard.writeText(images.join("\n"));
        toast({
          title: "Links Copied",
          description: "Image links have been copied to your clipboard",
        });
      } catch (clipboardError) {
        toast({
          variant: "destructive",
          title: "Sharing Failed",
          description:
            "Could not share images. Please try copying the links manually.",
        });
      }
    }
  };

  const handleDownloadImages = async (images, productName, supplierName) => {
    try {
      const zip = new JSZip();
      const folderName = `${sanitizeFileName(productName)}_${sanitizeFileName(
        supplierName || "unknown"
      )}`;
      const folder = zip.folder(folderName);

      // Create loading toast
      toast({
        title: "Preparing Download",
        description: "Creating ZIP file of images...",
      });

      // Download all images and add to zip
      const imagePromises = images.map(async (url, index) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();

          // Get file extension from content type or fallback to jpg
          const contentType = response.headers.get("content-type");
          const extension = contentType ? contentType.split("/")[1] : "jpg";

          // Add file to zip
          folder.file(`${productName}_${index + 1}.${extension}`, blob);
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error);
          throw new Error(`Failed to process image ${index + 1}`);
        }
      });

      // Wait for all images to be processed
      await Promise.all(imagePromises);

      // Generate zip file
      const content = await zip.generateAsync({ type: "blob" });

      // Create download link
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${folderName}.zip`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Success toast
      toast({
        title: "Download Complete",
        description: "Images have been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error creating zip file:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try again.",
      });
    }
  };

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

  const handleProductDelete = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product. Please try again.",
      });
    } else {
      fetchProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
    }
  };

  const handleSupplierDelete = async (id) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      console.error("Error deleting supplier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
      });
    } else {
      fetchSuppliers();
      fetchProducts();
      toast({
        title: "Success",
        description: "Supplier deleted successfully.",
      });
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setIsProductEditDialogOpen(true);
  };

  const handleSupplierEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierEditDialogOpen(true);
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        cost: editingProduct.cost,
        sellingPrice: editingProduct.sellingPrice,
        quantity: editingProduct.quantity,
      })
      .eq("id", editingProduct.id);

    if (error) {
      console.error("Error updating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product. Please try again.",
      });
    } else {
      fetchProducts();
      setIsProductEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
    }
  };

  const handleSupplierUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: editingSupplier.name,
        code: editingSupplier.code,
      })
      .eq("id", editingSupplier.id);

    if (error) {
      console.error("Error updating supplier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update supplier. Please try again.",
      });
    } else {
      fetchSuppliers();
      fetchProducts();
      setIsSupplierEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Supplier updated successfully.",
      });
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

  // Business metrics
  const analytics = useMemo(() => {
    if (!products.length) return null;

    const totalInventoryValue = products.reduce(
      (sum, product) => sum + product.cost * product.quantity,
      0
    );

    const totalRetailValue = products.reduce(
      (sum, product) => sum + product.sellingPrice * product.quantity,
      0
    );

    const lowStockItems = products.filter((p) => p.quantity <= 5).length;
    const outOfStockItems = products.filter((p) => p.quantity === 0).length;

    // New analytics focused on inventory
    const totalUniqueProducts = products.length;
    const totalItemsInStock = products.reduce((sum, p) => sum + p.quantity, 0);

    return {
      totalInventoryValue,
      totalRetailValue,
      lowStockItems,
      outOfStockItems,
      totalUniqueProducts,
      totalItemsInStock,
    };
  }, [products]);

  // Filter states
  const [filterSettings, setFilterSettings] = useState({
    sortField: "created_at", // Changed default sort
    sortDirection: "desc", // Newest first
    priceRange: { min: "", max: "" },
    inventoryValue: "all", // New filter
    productAge: "all", // New filter
  });

  // Modified applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    sortField: "created_at",
    sortDirection: "desc",
    priceRange: { min: "", max: "" },
    inventoryValue: "all",
    productAge: "all",
  });

  // Batch operation handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(
        filteredAndSortedProducts.map((product) => product.id)
      );
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBatchEdit = async () => {
    try {
      const updates = [];
      selectedProducts.forEach((productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const updateData = {};

        // Handle selling price update
        if (batchEditData.sellingPrice.value) {
          if (batchEditData.sellingPrice.type === "fixed") {
            updateData.sellingPrice = Math.round(Number(batchEditData.sellingPrice.value));
          } else {
            const percentage = Number(batchEditData.sellingPrice.value) / 100;
            updateData.sellingPrice = Math.round(product.sellingPrice * (1 + percentage));
          }
        }

        // Handle cost update
        if (batchEditData.cost.value) {
          if (batchEditData.cost.type === "fixed") {
            updateData.cost = Math.round(Number(batchEditData.cost.value));
          } else {
            const percentage = Number(batchEditData.cost.value) / 100;
            updateData.cost = Math.round(product.cost * (1 + percentage));
          }
        }

        // Handle quantity update
        if (batchEditData.quantity.value) {
          if (batchEditData.quantity.type === "fixed") {
            updateData.quantity = Math.round(Number(batchEditData.quantity.value));
          } else {
            const percentage = Number(batchEditData.quantity.value) / 100;
            updateData.quantity = Math.round(
              product.quantity * (1 + percentage)
            );
          }
        }

        console.log(updateData)

        if (Object.keys(updateData).length > 0) {
          updates.push(
            supabase.from("products").update(updateData).eq("id", productId)
          );
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
        toast({
          title: "Success",
          description: `Updated ${updates.length} products successfully.`,
        });
        fetchProducts();
        setSelectedProducts(new Set());
        setIsBatchEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error in batch update:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update products. Please try again.",
      });
    }
  };

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterSettings });
  };

  // Modified filteredAndSortedProducts to use appliedFilters
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    filtered = filtered.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.barcode.toString().includes(productSearchTerm) ||
        getSupplier(product.supplier)
          ?.name.toLowerCase()
          .includes(productSearchTerm.toLowerCase());

      const matchesSupplier =
        selectedSupplier === "all" || product.supplier === selectedSupplier;

      const matchesPriceRange =
        (!appliedFilters.priceRange.min ||
          product.sellingPrice >= Number(appliedFilters.priceRange.min)) &&
        (!appliedFilters.priceRange.max ||
          product.sellingPrice <= Number(appliedFilters.priceRange.max));

      // New inventory value filter
      const inventoryValue = product.cost * product.quantity;
      const matchesInventoryValue =
        appliedFilters.inventoryValue === "all" ||
        (appliedFilters.inventoryValue === "high" && inventoryValue > 10000) ||
        (appliedFilters.inventoryValue === "medium" &&
          inventoryValue > 5000 &&
          inventoryValue <= 10000) ||
        (appliedFilters.inventoryValue === "low" && inventoryValue <= 5000);

      // New product age filter
      const productAge = new Date() - new Date(product.created_at);
      const matchesAge =
        appliedFilters.productAge === "all" ||
        (appliedFilters.productAge === "new" &&
          productAge <= 7 * 24 * 60 * 60 * 1000) || // 7 days
        (appliedFilters.productAge === "recent" &&
          productAge <= 30 * 24 * 60 * 60 * 1000) || // 30 days
        (appliedFilters.productAge === "old" &&
          productAge > 30 * 24 * 60 * 60 * 1000);

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesPriceRange &&
        matchesInventoryValue &&
        matchesAge
      );
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (appliedFilters.sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.sellingPrice - b.sellingPrice;
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "margin":
          const marginA = ((a.sellingPrice - a.cost) / a.cost) * 100;
          const marginB = ((b.sellingPrice - b.cost) / b.cost) * 100;
          comparison = marginA - marginB;
          break;
      }
      return appliedFilters.sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [products, productSearchTerm, selectedSupplier, appliedFilters]);

  const filterAndSortProducts = (products) => {
    let filtered = [...products];

    // Apply filters
    filtered = filtered.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.barcode.toString().includes(productSearchTerm) ||
        getSupplier(product.supplier)
          ?.name.toLowerCase()
          .includes(productSearchTerm.toLowerCase());

      const matchesSupplier =
        selectedSupplier === "all" || product.supplier === selectedSupplier;

      const matchesPriceRange =
        (!appliedFilters.priceRange.min ||
          product.sellingPrice >= Number(appliedFilters.priceRange.min)) &&
        (!appliedFilters.priceRange.max ||
          product.sellingPrice <= Number(appliedFilters.priceRange.max));

      // New inventory value filter
      const inventoryValue = product.cost * product.quantity;
      const matchesInventoryValue =
        appliedFilters.inventoryValue === "all" ||
        (appliedFilters.inventoryValue === "high" && inventoryValue > 10000) ||
        (appliedFilters.inventoryValue === "medium" &&
          inventoryValue > 5000 &&
          inventoryValue <= 10000) ||
        (appliedFilters.inventoryValue === "low" && inventoryValue <= 5000);

      // New product age filter
      const productAge = new Date() - new Date(product.created_at);
      const matchesAge =
        appliedFilters.productAge === "all" ||
        (appliedFilters.productAge === "new" &&
          productAge <= 7 * 24 * 60 * 60 * 1000) || // 7 days
        (appliedFilters.productAge === "recent" &&
          productAge <= 30 * 24 * 60 * 60 * 1000) || // 30 days
        (appliedFilters.productAge === "old" &&
          productAge > 30 * 24 * 60 * 60 * 1000);

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesPriceRange &&
        matchesInventoryValue &&
        matchesAge
      );
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (appliedFilters.sortField) {
        case "created_at":
          comparison = new Date(b.created_at) - new Date(a.created_at);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.sellingPrice - b.sellingPrice;
          break;
        case "inventory_value":
          comparison = b.cost * b.quantity - a.cost * a.quantity;
          break;
      }
      return appliedFilters.sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className={"bg-transparent text-white"}>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.totalUniqueProducts.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400">Unique Products</p>
        </CardContent>
      </Card>

      <Card className={"bg-transparent text-white"}>
        <CardHeader>
          <CardTitle className="text-lg">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.totalItemsInStock.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400">Items in Stock</p>
        </CardContent>
      </Card>

      <Card className={"bg-transparent text-white"}>
        <CardHeader>
          <CardTitle className="text-lg">Stock Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{analytics?.totalInventoryValue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400">Total inventory value</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderStockAlerts = () => {
    if (analytics?.lowStockItems || analytics?.outOfStockItems) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Inventory Alert</AlertTitle>
          <AlertDescription>
            {analytics.outOfStockItems > 0 && (
              <div>{analytics.outOfStockItems} items out of stock</div>
            )}
            {analytics.lowStockItems > 0 && (
              <div>{analytics.lowStockItems} items running low</div>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const ProductActions = ({ product }) => {
    const hasImages = product.images && product.images.length > 0;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleProductEdit(product)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openImageUploadDialog(product)}>
            <Upload className="h-4 w-4 mr-2" /> Upload Images
          </DropdownMenuItem>
          {hasImages && (
            <>
              <DropdownMenuItem
                onClick={() => handleImageClick(product.images)}
              >
                <ImageIcon className="h-4 w-4 mr-2" /> Show Images
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleShareImages(product.images, product.name)}
              >
                <Share2 className="h-4 w-4 mr-2" /> Share Images
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleDownloadImages(
                    product.images,
                    product.name,
                    getSupplier(product.supplier)?.name
                  );
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Download ZIP
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => handleProductDelete(product.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-300 text-black">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 text-black"
            >
              <TrendingUp className="h-4 w-4" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
          </div>

          {showAnalytics && renderAnalytics()}
          {/* {renderStockAlerts()} */}

          <div className="flex flex-col gap-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filterSettings.sortField}
                onValueChange={(value) =>
                  setFilterSettings((prev) => ({ ...prev, sortField: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="inventory_value">
                    Inventory Value
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterSettings.inventoryValue}
                onValueChange={(value) =>
                  setFilterSettings((prev) => ({
                    ...prev,
                    inventoryValue: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Inventory value..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Values</SelectItem>
                  <SelectItem value="high">
                    High Value ({">₹10,000"})
                  </SelectItem>
                  <SelectItem value="medium">
                    Medium Value (₹5,000-₹10,000)
                  </SelectItem>
                  <SelectItem value="low">Low Value ({"<₹5,000"})</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterSettings.productAge}
                onValueChange={(value) =>
                  setFilterSettings((prev) => ({ ...prev, productAge: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Product age..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="new">New (Last 7 days)</SelectItem>
                  <SelectItem value="recent">Recent (Last 30 days)</SelectItem>
                  <SelectItem value="old">Older ({">30 days"})</SelectItem>
                </SelectContent>
              </Select>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Min Price"
                value={filterSettings.priceRange.min}
                onChange={(e) =>
                  setFilterSettings((prev) => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, min: e.target.value },
                  }))
                }
                className="w-32"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filterSettings.priceRange.max}
                onChange={(e) =>
                  setFilterSettings((prev) => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: e.target.value },
                  }))
                }
                className="w-32"
              />
              </div>
              <Button
                onClick={handleApplyFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-400">
                {selectedProducts.size} items selected
              </span>
              <Button
                className={"text-black"}
                variant="outline"
                onClick={() => setIsBatchEditDialogOpen(true)}
              >
                Edit Selected
              </Button>
              <Button
                className={"text-black"}
                variant="outline"
                onClick={() => setSelectedProducts(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          <Input
            placeholder="Search products, supplier, barcode..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100"
          />
          <div className="flex justify-around items-center mb-4 gap-5 w-full mt-2">
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
            <Select
              className="text-sky-400"
              onValueChange={setSelectedSupplier}
              defaultValue="all"
            >
              <SelectTrigger className="w-[200px] text-sky-400">
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

          <Table className="bg-[#09090b] rounded-md">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedProducts.size === filteredAndSortedProducts.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-sky-400 w-12"></TableHead>
                <TableHead className="text-sky-400">Name</TableHead>
                {showCostColumn && (
                  <TableHead className="text-sky-400">Cost</TableHead>
                )}
                <TableHead className="text-sky-400">Selling Price</TableHead>
                <TableHead className="text-sky-400">Barcode</TableHead>
                <TableHead className="text-sky-400">Quantity</TableHead>
                <TableHead className="text-sky-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* {filteredProducts.map((product) => ( */}
              {filteredAndSortedProducts.map((product) => (
                <TableRow key={product.id} className="text-white">
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.images && product.images.length > 0 && (
                      <Avatar
                        className="cursor-pointer"
                        onClick={() => handleImageClick(product.images)}
                      >
                        <AvatarImage
                          loading="lazy"
                          src={product.images[0]}
                          alt={product.name}
                        />
                        <AvatarFallback>
                          <ImageIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span
                        style={{ fontSize: "13px" }}
                        className="text-sky-500"
                      >
                        {getSupplier(product.supplier)?.name ?? "Loading..."}
                      </span>
                    </div>
                  </TableCell>
                  {showCostColumn && <TableCell>₹{product.cost}</TableCell>}
                  <TableCell>₹{product.sellingPrice}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>
                    <ProductActions product={product} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="suppliers">
          <Input
            placeholder="Search suppliers..."
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100 mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sky-400">Name</TableHead>
                <TableHead className="text-sky-400">Code</TableHead>
                <TableHead className="text-sky-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={isProductEditDialogOpen}
        onOpenChange={setIsProductEditDialogOpen}
      >
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

      <Dialog
        open={isSupplierEditDialogOpen}
        onOpenChange={setIsSupplierEditDialogOpen}
      >
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <form onSubmit={handleSupplierUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName" className="text-sky-400">
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
                <Label htmlFor="supplierCode" className="text-sky-400">
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
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              >
                Update Supplier
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div
        className={`${
          isImageDialogOpen ? "flex" : "hidden"
        } fixed inset-0 z-50 items-center justify-center bg-black bg-opacity-75`}
        onClick={handleOutsideClick} // Handle outside click
      >
        <div className="relative bg-slate-800 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto p-4">
          {/* Close Icon */}
          <button
            onClick={() => {
              setIsImageDialogOpen(false);
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-red-500 hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5 text-white font-bold" /> {/* Close icon */}
          </button>

          {/* Image Grid */}
          <PhotoProvider>
            <div className="foo grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2">
              {" "}
              {/* Responsive grid columns */}
              {selectedImages.map((item, index) => (
                <PhotoView key={item} src={item}>
                  <LazyLoadImage
                    src={item}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80" // Responsive images
                  />
                </PhotoView>
              ))}
            </div>
          </PhotoProvider>
        </div>
      </div>

      <Dialog
        open={isImageUploadDialogOpen}
        onOpenChange={setIsImageUploadDialogOpen}
      >
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images" className="text-sky-400">
                Add New Images:
              </Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="bg-gray-700 border-gray-600 text-gray-100"
                ref={fileInputRef}
                onClick={(e) => (e.target.value = null)}
              />
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={`preview-${index}`} className="relative">
                    <LazyLoadImage
                      src={preview.url}
                      alt={`Preview ${index}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleDiscardImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleImageUpload}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              disabled={imagePreviews.length === 0}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBatchEditDialogOpen}
        onOpenChange={setIsBatchEditDialogOpen}
      >
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Batch Edit Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(batchEditData).map(([field, data]) => (
              <div key={field} className="space-y-2">
                <Label className="text-sky-400 capitalize">{field}:</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={data.value}
                    onChange={(e) =>
                      setBatchEditData((prev) => ({
                        ...prev,
                        [field]: { ...prev[field], value: e.target.value },
                      }))
                    }
                    className="bg-gray-700 border-gray-600 text-gray-100"
                    placeholder={`Enter ${field}`}
                  />
                  <Select
                    value={data.type}
                    onValueChange={(value) =>
                      setBatchEditData((prev) => ({
                        ...prev,
                        [field]: { ...prev[field], type: value },
                      }))
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <footer>
            <Button
              onClick={handleBatchEdit}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
            >
              Update {selectedProducts.size} Products
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;