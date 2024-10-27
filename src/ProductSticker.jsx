import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PrintableSticker = ({ sku, price, barcodeUrl }) => {
  return (
    <div
      id="sticker"
      style={{
        width: "55mm",
        height: "22mm",
        border: "0.5px solid black",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
        fontSize: "8px",
        textAlign: "center",
        backgroundColor: "white",
        color: "black",
        padding: "0", // Remove padding
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        width: "100%",
        fontSize: "13px",
        margin: "0"
      }}>
        <p style={{ fontWeight: "bold", margin: "0" }}>VARIETY HEAVEN</p>
        <p style={{ fontWeight: "bold", margin: "0" }}>MRP: ₹{price}</p>
      </div>
      {barcodeUrl && (
        <div style={{
          overflow: "hidden",
          width: "50mm",
          height: "16mm",
        }
        }>
          <img
            src={barcodeUrl}
            alt="Barcode"
            style={{

              margin: "2px 0", // Minimal margin for spacing
            }}
          />

        </div>
      )}
    </div>
  );
};


const ProductSticker = () => {
  const [sku, setSku] = useState('SAMPLE SKU');
  const [price, setPrice] = useState('19999');
  const [quantity, setQuantity] = useState('33');
  const [barcodeUrl, setBarcodeUrl] = useState('');

  useEffect(() => {
    if (sku) {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, sku, { format: 'CODE128' });
      setBarcodeUrl(canvas.toDataURL('image/png'));
    }
  }, [sku]);

  const handlePrint = async () => {
    if (!sku || !price || !quantity) {
      alert("Please fill in all fields before printing the sticker.");
      return;
    }

    const stickerElement = document.getElementById('sticker');
    const canvas = await html2canvas(stickerElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const w = 53;
    const h = 22;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [w, h],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, w, h);

    // Convert PDF to Blob and open in a new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  };

  return (
    <div className="flex-grow p-6 h-screen overflow-auto bg-gray-900 text-gray-100">
      <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sky-500">Create Product Sticker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 bg-white p-4 rounded-md">
            <PrintableSticker sku={sku} barcodeUrl={barcodeUrl} price={price} />
          </div>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sky-400">SKU:</Label>
              <Input
                id="sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sky-400">Price:</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sky-400">Quantity:</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <Button
              type="button"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" /> Generate Sticker
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSticker;
