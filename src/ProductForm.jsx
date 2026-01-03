import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  BetweenHorizontalEnd,
  PencilLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "./supabaseClient";
import { Switch } from "@/components/ui/switch";

const ProductName = ({ items, placeholder, onSelect, value }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-black"
        >
          {value ? items.find((item) => item.id === value)?.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
          />
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandList>
            {items.map((item) => (
              <CommandItem
                className="text-black"
                key={item.id}
                onSelect={() => {
                  onSelect(item.id === value ? "" : item.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex w-full justify-between">
                  <span>{item.name}</span>
                  <span>₹ {item.sellingPrice}</span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProductForm = ({
  handleSubmit,
  productName,
  setProductName,
  productQuantity,
  setProductQuantity,
  productPrice,
  setProductPrice,
  editingProduct,
  products,
}) => {
  // const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const { data: productsData, error: productsError } = await supabase
  //       .from("products")
  //       .select("id, name, quantity, sellingPrice, supplier");

  //     const { data: suppliersData, error: suppliersError } = await supabase
  //       .from("suppliers")
  //       .select("id, name");

  //     if (productsError)
  //       console.error("Error fetching products:", productsError);
  //     else setProducts(productsData);

  //     if (suppliersError)
  //       console.error("Error fetching suppliers:", suppliersError);
  //     else setSuppliers(suppliersData);
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    if (editingProduct) {
      setSelectedProduct(editingProduct.id || "");
      setSelectedSupplier(editingProduct.supplier || "");
    }
  }, [editingProduct]);

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === selectedProduct);
      if (product) {
        setSelectedSupplier(product.supplier || "");
        setProductName(product.name);
        setProductQuantity(1)
        setProductPrice(product.sellingPrice);
      }
    }
  }, [selectedProduct, products]);

  return (
    <form onSubmit={handleSubmit} className="mb-2 p-">
      <div className="space-y-4 md:space-y-0 md:flex md:flex-wra md:gap-4">
        {/* Product Name Section */}
        <div className="w-full md:w-[48%]">
          <div className="flex items-center justify-between mb-2">
            <label
              className="font-bold text-pink-500 text-sm"
              htmlFor="productName"
            >
              Product Name:
            </label>
            <Switch
              id="add-supplier"
              className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
              checked={isAddingNewProduct}
              onCheckedChange={setIsAddingNewProduct}
            />
          </div>
          {isAddingNewProduct ? (
            <input
              className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-pink-500 focus:outline-none"
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          ) : (
            <ProductName
              items={products}
              placeholder="Select product..."
              onSelect={setSelectedProduct}
              value={selectedProduct}
            />
          )}
        </div>

        {/* Quantity Section */}
        <div className="w-full md:w-[24%]">
          <label
            className="block mb-1 font-bold text-pink-500 text-sm"
            htmlFor="productQuantity"
          >
            Quantity:
          </label>
          <input
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-pink-500 focus:outline-none"
            type="number"
            id="productQuantity"
            value={productQuantity}
            onChange={(e) => setProductQuantity(e.target.value)}
            required
          />
        </div>

        {/* Price Section */}
        <div className="w-full md:w-[24%]">
          <label
            className="block mb-1 font-bold text-pink-500 text-sm"
            htmlFor="productPrice"
          >
            Price:
          </label>
          <input
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-pink-500 focus:outline-none"
            type="number"
            id="productPrice"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="w-full md:w-auto md:self-end">
          <button
            type="submit"
            className="w-full md:w-auto bg-pink-600 text-white px-6 py-2 rounded-md cursor-pointer hover:bg-pink-600 transition-colors"
          >
            {editingProduct !== null ? (
              <div>
                <PencilLine size={27} />
                <span className="md:hidden">Update Product</span>
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                <BetweenHorizontalEnd size={27} />
                <span className="md:hidden">Add Product</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
