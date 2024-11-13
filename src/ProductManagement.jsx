import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AddProduct from './Inventory/AddProduct';
import ManageProducts from './Inventory/ManageProducts';
import GenerateStickers from './Inventory/GenerateStickers';

const ProductManagement = () => {
  return (
    <div className="flex-grow p-6 h-screen overflow-auto bg-gray-900 text-gray-100">
      <Card className="mx-auto bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <Tabs defaultValue="add" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add">Add Product</TabsTrigger>
              <TabsTrigger value="manage">Manage Products</TabsTrigger>
              <TabsTrigger value="stickers">Generate Stickers</TabsTrigger>
            </TabsList>
            <TabsContent value="add">
              <AddProduct />
            </TabsContent>
            <TabsContent value="manage">
              <ManageProducts />
            </TabsContent>
            <TabsContent value="stickers">
              <GenerateStickers />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;