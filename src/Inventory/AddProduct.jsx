import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from '../supabaseClient';

import { useToast } from "@/hooks/use-toast"

const AddProduct = () => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState(''); // New state for quantity
  const [supplier, setSupplier] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch suppliers. Please try again.",
      });
    } else {
      setSuppliers(data);
    }
  };

  const generateSupplierCode = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('code')
      .order('code', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last supplier code:', error);
      return '001';
    }

    const lastCode = data[0]?.code || '000';
    const nextCode = (parseInt(lastCode, 10) + 1).toString().padStart(3, '0');
    return nextCode;
  };

  const generateProductCode = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('barcode')
      .order('barcode', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last product code:', error);
      return '00001';
    }

    const lastBarcode = data[0]?.barcode || '00000000';
    console.log(lastBarcode)
    const lastProductCode = lastBarcode.toString().slice(-5);
    const nextProductCode = (parseInt(lastProductCode, 10) + 1).toString().padStart(5, '0');
    return nextProductCode;
  };

  const addNewSupplier = async () => {
    const newSupplierCode = await generateSupplierCode();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ name: newSupplierName, code: newSupplierCode }])
      .select();

    if (error) {
      console.error('Error adding new supplier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new supplier. Please try again.",
      });
      return null;
    } else {
      console.log('New supplier added successfully:', data);
      await fetchSuppliers();
      return data[0];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let currentSupplier = supplier;
    let supplierCode;

    if (isAddingNewSupplier) {
      const newSupplier = await addNewSupplier();
      if (newSupplier) {
        currentSupplier = newSupplier.id;
        supplierCode = newSupplier.code;
      } else {
        return; // Exit if adding new supplier failed
      }
    } else {
      supplierCode = suppliers.find(s => s.id === supplier)?.code;
    }

    const productCode = await generateProductCode();
    const barcode = `${supplierCode}${productCode}`;

    const { data, error } = await supabase
      .from('products')
      .insert([
        { name, cost, sellingPrice, supplier: currentSupplier, barcode, quantity: parseInt(quantity, 10) }
      ]);

    if (error) {
      console.error('Error adding product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product. Please try again.",
      });
    } else {
      console.log('Product added successfully:', data);
      toast({
        title: "Success",
        description: "Product added successfully.",
      });
      // Reset form
      setName('');
      setCost('');
      setSellingPrice('');
      setQuantity('');
      // setSupplier('');
      setNewSupplierName('');
      setIsAddingNewSupplier(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className='flex w-full gap-5 items-center'>
        <div className="flex items-center space-x-2">
          <Switch
            id="add-supplier"
            className="data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-zinc-500"
            checked={isAddingNewSupplier}
            onCheckedChange={setIsAddingNewSupplier}
          />
          <Label htmlFor="add-supplier" className="text-sky-400 text-nowrap">New Supplier</Label>
        </div>
        {isAddingNewSupplier ? (
          <div className="space-y-2 w-full">
            <Input
              id="newSupplierName"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
              placeholder="New Supplier Name"
            />
          </div>
        ) : (
          <div className="space-y-2 w-full">
            <Select onValueChange={setSupplier} value={supplier}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sky-400">Product Name:</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 border-gray-600 text-gray-100"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-sky-400">Quantity:</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="bg-gray-700 border-gray-600 text-gray-100"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cost" className="text-sky-400">Cost:</Label>
        <Input
          id="cost"
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="bg-gray-700 border-gray-600 text-gray-100"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sellingPrice" className="text-sky-400">Selling Price:</Label>
        <Input
          id="sellingPrice"
          type="number"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          className="bg-gray-700 border-gray-600 text-gray-100"
          required
        />
      </div>
      
      
      <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white">
        Add Product
      </Button>
    </form>
  );
};

export default AddProduct;