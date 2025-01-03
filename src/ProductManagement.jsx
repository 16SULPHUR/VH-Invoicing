import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AddProduct from './Inventory/AddProduct';
import ManageProducts from './Inventory/ManageProducts';
import GenerateStickers from './Inventory/GenerateStickers';

const ProductManagement = () => {
  return (
    <div className="h-screen bg-gray-190 text-gray-100 px-2">
      {/* <Card className="bg-gray-900">
        <CardContent className=""> */}
          <Tabs defaultValue="manage" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-300 text-black">
              <TabsTrigger value="manage">Manage Products</TabsTrigger>
              <TabsTrigger value="add">Add Product</TabsTrigger>
            </TabsList>
            <TabsContent value="add">
              <AddProduct />
            </TabsContent>
            <TabsContent value="manage">
              <ManageProducts />
            </TabsContent>
          </Tabs>
        {/* </CardContent>
      </Card> */}
    </div>
  );
};

export default ProductManagement;