import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { codeGenerator } from "@/services/productService";
import { supplierService } from "@/services/supplierService";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { TextArea } from "@/features/counter/components/Bits";
import { DEFAULT_CREDIT_DAYS } from "../lib/billMath";

const blank = { name: "", phone: "", city: "", gstin: "", credit_days: DEFAULT_CREDIT_DAYS, note: "" };

/** Adds a supplier, or edits the extra details (GSTIN, phone, credit days) of an existing one. */
export function SupplierEditor({ supplier, open, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!open) return;
    setForm(
      supplier
        ? {
            name: supplier.name ?? "",
            phone: supplier.phone ?? "",
            city: supplier.city ?? "",
            gstin: supplier.gstin ?? "",
            credit_days: supplier.credit_days ?? DEFAULT_CREDIT_DAYS,
            note: supplier.note ?? "",
          }
        : blank
    );
  }, [open, supplier]);

  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      const details = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        credit_days: Math.max(0, parseInt(form.credit_days, 10) || 0),
        note: form.note.trim() || null,
      };
      if (supplier) return (await supplierService.update(supplier.id, details))?.[0];
      const code = await codeGenerator.nextSupplierCode();
      return (await supplierService.create({ ...details, code }))?.[0];
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast({ title: supplier ? "Supplier updated" : "Supplier added" });
      onSaved?.(saved);
      onClose();
    },
    onError: (error) => toast({ title: "Couldn't save the supplier", description: error.message, variant: "destructive" }),
  });

  const valid = form.name.trim().length > 0 && (!form.gstin.trim() || /^\d{2}[A-Z0-9]{13}$/i.test(form.gstin.trim()));

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={supplier ? "Edit supplier" : "New supplier"}
      description="Credit days set the due date of each new bill."
      footer={
        <>
          <Button variant="rani" className="press" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save supplier"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <Field label="Name" required>{(id) => <Input id={id} value={form.name} onChange={set("name")} autoComplete="off" />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">{(id) => <Input id={id} value={form.phone} onChange={set("phone")} inputMode="tel" />}</Field>
        <Field label="City">{(id) => <Input id={id} value={form.city} onChange={set("city")} />}</Field>
      </div>
      <Field
        label="GSTIN"
        hint="Needed for GST input credit. A GSTIN from outside Gujarat makes the bill IGST."
        error={form.gstin.trim() && !valid ? "A GSTIN has 15 characters." : undefined}
      >
        {(id) => <Input id={id} value={form.gstin} onChange={set("gstin")} className="uppercase" maxLength={15} />}
      </Field>
      <Field label="Credit days" hint="Days this supplier usually allows before payment is due.">
        {(id) => <Input id={id} type="number" min={0} value={form.credit_days} onChange={set("credit_days")} />}
      </Field>
      <Field label="Note">{(id) => <TextArea id={id} value={form.note} onChange={set("note")} />}</Field>
    </ToolSheet>
  );
}
