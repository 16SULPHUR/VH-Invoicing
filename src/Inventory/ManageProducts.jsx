import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Share2,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const handleImageClick = (images) => {
    setSelectedImages(images);
    setIsImageDialogOpen(true);
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

  const handleDownloadImages = async (images) => {
    images.forEach((url, index) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `product-image-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
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
          <DropdownMenuItem onClick={() => handleProductDelete(product.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                onClick={() => handleDownloadImages(product.images)}
              >
                <Download className="h-4 w-4 mr-2" /> Download Images
              </DropdownMenuItem>
            </>
          )}
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
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="text-white">
                  <TableCell>
                    {product.images && product.images.length > 0 && (
                      <Avatar
                        className="cursor-pointer"
                        onClick={() => handleImageClick(product.images)}
                      >
                        <AvatarImage
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
                  {/* <TableCell>
                    {getSupplier(product.supplier)?.name ?? "Loading..."}
                  </TableCell> */}
                  {showCostColumn && <TableCell>₹{product.cost}</TableCell>}
                  <TableCell>₹{product.sellingPrice}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  {/* <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleProductEdit(product)}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="h-4 w-4 text-black" />
                      </Button>
                      <Button
                        onClick={() => handleProductDelete(product.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell> */}
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

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Images</DialogTitle>
          </DialogHeader>
          <div className="w-full max-w-lg mx-auto">
            <Carousel>
              <CarouselContent>
                {selectedImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="flex items-center justify-center p-2">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="max-h-[60vh] object-contain rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;
