import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import ReactDOMServer from "react-dom/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PrintableSticker = ({ sku, price, barcodeUrl }) => {
  return (
    <div style={{width:"2in", height:"1in"}} className="sticker rounded-md text-center bg-white text-black p-2">
      <p className='font-mono font-semibold text-xs'>MRP: ₹{price}</p>
      {barcodeUrl && <img src={barcodeUrl} alt="Barcode" className="leading-3 h-16 mx-auto" />}
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

  const handlePrint = () => {
    if (!sku || !price || !quantity) {
      alert("Please fill in all fields before printing the sticker.");
      return;
    }

    const printContent = (<PrintableSticker sku={sku} barcodeUrl={barcodeUrl} price={price}/>)

    const printWindow = window.open('', '', 'width=1000,height=1000');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Product Sticker</title>
        </head>
        <body>
          ${ReactDOMServer.renderToString(printContent)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="flex-grow p-6 h-screen overflow-auto bg-gray-900 text-gray-100">
      <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sky-500">Create Product Sticker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 bg-white p-4 rounded-md">
            <PrintableSticker sku={sku} barcodeUrl={barcodeUrl} price={price}/>
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