import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageCustomers from './Customers/ManageCustomers';
import AddCustomer from './Customers/AddCustomer';
import GenerateReports from './Customers/GenerateReports';

const CustomerManagement = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>
      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Customers</TabsTrigger>
          <TabsTrigger value="add">Add Customer</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <ManageCustomers />
        </TabsContent>
        <TabsContent value="add">
          <AddCustomer />
        </TabsContent>
        <TabsContent value="reports">
          <GenerateReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerManagement;