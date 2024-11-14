import React, { useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
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
import { Printer } from "lucide-react";
import { supabase } from "../supabaseClient";
import generatePDF, { Resolution, Margin, usePDF } from "react-to-pdf";

const PrintableSticker = ({ sku, price, barcodeUrl }) => {
  return (
    <div
      id="sticker"
      style={{
        width: "50.8mm",
        height: "25.4mm",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "monospace",
        backgroundColor: "white",
        color: "black",
        padding: "0mm",
        margin: "0mm",
        border: "0.5px solid black",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "2px 4px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          VARIETY HEAVEN
        </span>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            margin: "0mm",
          }}
        >
          ₹{price}
        </span>
      </div>

      {barcodeUrl && (
        <div
          style={{
            width: "100%",
            height: "12mm",
            margin: "0mm",
            overflow: "hidden",
          }}
        >
          <img
            src={barcodeUrl}
            alt="Barcode"
            style={{
              margin: "0mm",
              marginTop: "-2mm",
              padding: "0mm",
            }}
          />
        </div>
      )}

      <div
        style={{
          width: "100%",
          padding: "2px 4px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            margin: "0mm",
          }}
        >
          {sku}
        </span>
      </div>
    </div>
  );
};

const GenerateStickers = () => {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [barcodeUrl, setBarcodeUrl] = useState("");

  const options = {
    method: "open",
    resolution: Resolution.HIGH,
    page: {
      margin: Margin.NONE,
      format: [50.8, 25.4],
      orientation: "landscape",
    },
    canvas: {
      mimeType: "image/png",
      qualityRatio: 1,
    },
    overrides: {
      pdf: {
        compress: true,
      },
      canvas: {
        useCORS: true,
      },
    },
  };

  const getTargetElement = () => document.getElementById("sticker");

  const { toPDF, targetRef } = usePDF(options);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase.from("suppliers").select("*");
    if (error) console.error("Error fetching suppliers:", error);
    else setSuppliers(data);
  };

  useEffect(() => {
    if (selectedSupplier) {
      fetchProducts(selectedSupplier);
    }
  }, [selectedSupplier]);

  const fetchProducts = async (supplierId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("supplier", supplierId);
    if (error) console.error("Error fetching products:", error);
    else setProducts(data);
  };

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === selectedProduct);
      if (product) {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, product.barcode, { format: "CODE128" });
        setBarcodeUrl(canvas.toDataURL("image/png"));
        // Set quantity to product's quantity
        setQuantity(product.quantity.toString());
      }
    }
  }, [selectedProduct, products]);

  const handlePrint = async () => {
    if (!selectedProduct || !quantity) {
      alert(
        "Please select a product and specify quantity before printing the sticker."
      );
      return;
    }

    generatePDF(getTargetElement, options);
  };

  // Create an array based on the quantity
  const stickers = Array.from(
    { length: parseInt(quantity) },
    (_, index) => index
  );

  return (
    <div className="space-y-4">
      <div
        className="mb-6 bg-white p-4 rounded-md h-40 overflow-scroll"
        ref={targetRef}
      >
        {stickers.map((index) => (
          <PrintableSticker
            key={index}
            sku={
              products.find((p) => p.id === selectedProduct)?.name ||
              "SAMPLE SKU"
            }
            barcodeUrl={barcodeUrl}
            price={
              products.find((p) => p.id === selectedProduct)?.sellingPrice ||
              "0"
            }
          />
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplier" className="text-sky-400">
          Select Supplier:
        </Label>
        <Select onValueChange={setSelectedSupplier} value={selectedSupplier}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="product" className="text-sky-400">
          Select Product:
        </Label>
        <Select onValueChange={setSelectedProduct} value={selectedProduct}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-sky-400">
          Quantity:
        </Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="bg-gray-700 border-gray-600 text-gray-100"
        />
      </div>
      <Button
        type="button"
        className="w-full bg-sky-500 hover:bg-sky-600 text-white"
        onClick={handlePrint}
      >
        <Printer className="mr-2 h-4 w-4" /> Generate Stickers
      </Button>
    </div>
  );
};

export default GenerateStickers;
