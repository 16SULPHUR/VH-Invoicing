import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '../supabaseClient';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isProductEditDialogOpen, setIsProductEditDialogOpen] = useState(false);
  const [isSupplierEditDialogOpen, setIsSupplierEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
      alert("Failed to fetch products. Please try again.");
    } else {
      setProducts(data);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching suppliers:', error);
      alert("Failed to fetch suppliers. Please try again.");
    } else {
      setSuppliers(data);
    }
  };

  const handleProductDelete = async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      alert("Failed to delete product. Please try again.");
    } else {
      fetchProducts();
      alert("Product deleted successfully.");
    }
  };

  const handleSupplierDelete = async (id) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting supplier:', error);
      alert("Failed to delete supplier. Please try again.");
    } else {
      fetchSuppliers();
      fetchProducts(); // Refresh products as well, in case any were linked to this supplier
      alert("Supplier deleted successfully.");
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
      .from('products')
      .update({
        name: editingProduct.name,
        cost: editingProduct.cost,
        sellingPrice: editingProduct.sellingPrice,
      })
      .eq('id', editingProduct.id);

    if (error) {
      console.error('Error updating product:', error);
      alert("Failed to update product. Please try again.");
    } else {
      fetchProducts();
      setIsProductEditDialogOpen(false);
      alert("Product updated successfully.");
    }
  };

  const handleSupplierUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: editingSupplier.name,
        code: editingSupplier.code,
      })
      .eq('id', editingSupplier.id);

    if (error) {
      console.error('Error updating supplier:', error);
      alert("Failed to update supplier. Please try again.",);
    } else {
      fetchSuppliers();
      fetchProducts(); // Refresh products as well, in case any supplier names changed
      setIsSupplierEditDialogOpen(false);
      alert("Supplier updated successfully.");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.barcode.includes(productSearchTerm)
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.code.includes(supplierSearchTerm)
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Input
            placeholder="Search products..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100 mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sky-400">Name</TableHead>
                <TableHead className="text-sky-400">Barcode</TableHead>
                <TableHead className="text-sky-400">Cost</TableHead>
                <TableHead className="text-sky-400">Selling Price</TableHead>
                <TableHead className="text-sky-400">Supplier</TableHead>
                <TableHead className="text-sky-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>₹{product.cost}</TableCell>
                  <TableCell>₹{product.sellingPrice}</TableCell>
                  <TableCell>{product.supplier.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleProductEdit(product)}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleProductDelete(product.id)}
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
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.code}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSupplierEdit(supplier)}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="h-4 w-4" />
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

      <Dialog open={isProductEditDialogOpen} onOpenChange={setIsProductEditDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleProductUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sky-400">Product Name:</Label>
                <Input
                  id="name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sky-400">Cost:</Label>
                <Input
                  id="cost"
                  type="number"
                  value={editingProduct.cost}
                  onChange={(e) => setEditingProduct({...editingProduct, cost: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice" className="text-sky-400">Selling Price:</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={editingProduct.sellingPrice}
                  onChange={(e) => setEditingProduct({...editingProduct, sellingPrice: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                Update Product
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplierEditDialogOpen} onOpenChange={setIsSupplierEditDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <form onSubmit={handleSupplierUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName" className="text-sky-400">Supplier Name:</Label>
                <Input
                  id="supplierName"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierCode" className="text-sky-400">Supplier Code:</Label>
                <Input
                  id="supplierCode"
                  value={editingSupplier.code}
                  onChange={(e) => setEditingSupplier({...editingSupplier, code: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                Update Supplier
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;