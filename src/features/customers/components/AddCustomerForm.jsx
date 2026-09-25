import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddCustomer } from "../hooks/useCustomers";
import { WhatsAppFields } from "./WhatsAppFields";

const EMPTY_CUSTOMER = { name: "", address: "", phone: "" };
const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
];

export default function AddCustomerForm() {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const addCustomer = useAddCustomer();

  const handleSubmit = (event) => {
    event.preventDefault();
    addCustomer.mutate(customer, { onSuccess: () => setCustomer(EMPTY_CUSTOMER) });
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Add a customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(({ key, label, type }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs font-semibold text-muted-foreground">
                {label}
              </Label>
              <Input
                id={key}
                type={type}
                value={customer[key]}
                onChange={(event) =>
                  setCustomer((previous) => ({ ...previous, [key]: event.target.value }))
                }
                required
              />
            </div>
          ))}
          <WhatsAppFields
            idPrefix="add"
            customer={customer}
            onChange={(key, value) => setCustomer((previous) => ({ ...previous, [key]: value }))}
          />
          <Button type="submit" variant="rani" className="block-shadow w-full" disabled={addCustomer.isPending}>
            {addCustomer.isPending ? "Adding…" : "Add customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
