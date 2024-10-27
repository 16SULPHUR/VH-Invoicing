import React, { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';
import ProductTable from './ProductTable';
import { supabase } from './supabaseClient';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SyncedBarcodeScanner = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to fetch products. Please try again.');
      } else {
        setProducts(data);
      }
    };

    fetchProducts();

    // Set up real-time listener
    const productSubscription = supabase
      .channel('products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        if (payload.eventType === 'INSERT') {
          setProducts(prevProducts => [payload.new, ...prevProducts]);
        } else if (payload.eventType === 'DELETE') {
          setProducts(prevProducts => prevProducts.filter(product => product.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prevProducts => prevProducts.map(product => 
            product.id === payload.new.id ? payload.new : product
          ));
        }
      })
      .subscribe();

    return () => {
      productSubscription.unsubscribe();
    };
  }, []);

  const handleScannedItem = async (scannedItem) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          { 
            name: scannedItem.barcode, 
            quantity: 1, 
            price: 0, 
            amount: 0 
          }
        ]);

      if (error) throw error;
    } catch (error) {
      setError('Failed to add scanned item. Please try again.');
    }
  };

  const startEditing = (index) => {
    // Implement editing logic
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      setError('Failed to delete product. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <BarcodeScanner onScanned={handleScannedItem} />
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ProductTable 
        products={products} 
        startEditing={startEditing} 
        deleteProduct={deleteProduct} 
      />

      <Button onClick={() => setProducts([])}>Clear All Products</Button>
    </div>
  );
};

export default SyncedBarcodeScanner;