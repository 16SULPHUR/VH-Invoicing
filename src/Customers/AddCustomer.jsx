import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '../supabaseClient';

import { useToast } from "@/hooks/use-toast";

const AddCustomer = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, address, phone }]);

    if (error) {
      console.error('Error adding customer:', error);
    } else {
      toast({
        title: "Success",
        description: "Customer added successfully.",
      });
      setName('');
      setAddress('');
      setPhone('');
    }
  };

  return (
    <Card className="bg-transparent text-white">
      <CardHeader>
        <CardTitle>Add New Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Add Customer</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddCustomer;