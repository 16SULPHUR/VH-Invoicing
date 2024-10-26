import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";

const InvoiceForm = ({ onInvoiceCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState([{ name: '', quantity: 1, price: 0 }]);

  const addProduct = () => {
    setProducts([...products, { name: '', quantity: 1, price: 0 }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = products.reduce((sum, product) => sum + product.quantity * product.price, 0);
    
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        { customer_name: customerName, products: JSON.stringify(products), total }
      ]);

    if (error) {
      console.error('Error creating invoice:', error);
    } else {
      setCustomerName('');
      setProducts([{ name: '', quantity: 1, price: 0 }]);
      onInvoiceCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>
      {products.map((product, index) => (
        <div key={index} className="flex items-end space-x-2">
          <div className="flex-1">
            <Label htmlFor={`product-${index}`}>Product</Label>
            <Input
              id={`product-${index}`}
              value={product.name}
              onChange={(e) => updateProduct(index, 'name', e.target.value)}
              required
            />
          </div>
          <div className="w-20">
            <Label htmlFor={`quantity-${index}`}>Qty</Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              value={product.quantity}
              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
              required
              min="1"
            />
          </div>
          <div className="w-24">
            <Label htmlFor={`price-${index}`}>Price</Label>
            <Input
              id={`price-${index}`}
              type="number"
              value={product.price}
              onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
              required
              min="0"
              step="0.01"
            />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => removeProduct(index)}>
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addProduct} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Product
      </Button>
      <Button type="submit" className="w-full">Create Invoice</Button>
    </form>
  );
};

export default InvoiceForm;