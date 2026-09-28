import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import generatePDF, { Margin, Resolution, usePDF } from "react-to-pdf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PrintableSticker } from "./PrintableSticker";
import { useProducts, useSuppliers } from "../hooks/useInventory";

// 50.8mm x 25.4mm is the label stock this shop uses.
const PDF_OPTIONS = {
  method: "open",
  resolution: Resolution.HIGH,
  page: { margin: Margin.NONE, format: [50.8, 25.4], orientation: "landscape" },
  canvas: { mimeType: "image/png", qualityRatio: 1 },
  overrides: { pdf: { compress: true }, canvas: { useCORS: true } },
};

const inputClass = "border-border bg-surface text-foreground";

export default function GenerateStickers() {
  const { data: suppliers } = useSuppliers();
  const { data: allProducts } = useProducts();
  const { toast } = useToast();
  const { targetRef } = usePDF(PDF_OPTIONS);

  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const products = useMemo(
    () => allProducts.filter((product) => product.supplier === supplierId),
    [allProducts, supplierId]
  );

  const product = products.find((candidate) => candidate.id === productId);

  useEffect(() => {
    if (product) setQuantity(String(product.quantity ?? 1));
  }, [product]);

  const handlePrint = () => {
    if (!product || !quantity) {
      toast({
        variant: "destructive",
        title: "Nothing to print",
        description: "Select a product and set a quantity first.",
      });
      return;
    }
    generatePDF(() => document.getElementById("sticker"), PDF_OPTIONS);
  };

  return (
    <div className="flex w-full justify-between gap-10 space-y-4">
      <div className="w-3/5 space-y-2">
        <div className="space-y-2">
          <Label
            htmlFor="supplier"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Select Supplier:
          </Label>
          <Select
            value={supplierId}
            onValueChange={(value) => {
              setSupplierId(value);
              setProductId("");
            }}
          >
            <SelectTrigger id="supplier" className={inputClass}>
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="product"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Select Product:
          </Label>
          <Select value={productId} onValueChange={setProductId} disabled={!supplierId}>
            <SelectTrigger id="product" className={inputClass}>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  <div className="flex gap-2">
                    <span>{candidate.name}</span>
                    <span>₹ {candidate.sellingPrice}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="quantity"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Quantity:
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={inputClass}
          />
        </div>

        <Button type="button" className="w-full bg-primary hover:bg-primary" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Generate Stickers
        </Button>
      </div>

      <div className="paper mb-6 h-40 overflow-auto rounded-md p-4" ref={targetRef}>
        <PrintableSticker
          sku={product?.name ?? "SAMPLE SKU"}
          price={product?.sellingPrice ?? "0"}
          barcode={product?.barcode ?? "00000000"}
        />
      </div>
    </div>
  );
}
