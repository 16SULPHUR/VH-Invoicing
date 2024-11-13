import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';

const PrintableSticker = ({ sku, price, barcodeUrl }) => {
  return (
    <div
      id="sticker"
      style={{
        width: "55mm",
        height: "22mm",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
        fontSize: "8px",
        textAlign: "center",
        backgroundColor: "white",
        color: "black",
        padding: "0",
        marginTop: "0"
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        width: "100%",
        padding: "0 4px",
        fontSize: "13px",
        margin: "0"
      }}>
        <p style={{ fontWeight: "bold", margin: "0" }}>VARIETY HEAVEN</p>
        <p style={{ fontWeight: "bold", margin: "0" }}>₹{price}</p>
      </div>
      {barcodeUrl && (
        <div style={{
          overflow: "hidden",
          width: "50mm",
          height: "10mm",
          marginTop: "3px",
          marginBottom: "0px"
        }}>
          <img
            src={barcodeUrl}
            alt="Barcode"
            style={{
              margin: "0",
            }}
          />
        </div>
      )}
      <p style={{ fontWeight: "bold", margin: "0", fontSize: "13px" }}>{sku}</p>
    </div>
  );
};

const GenerateStickers = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [products, setProducts] = useState([]);
  const [barcodeUrl, setBarcodeUrl] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data);
  };

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, product.barcode, { format: 'CODE128' });
        setBarcodeUrl(canvas.toDataURL('image/png'));
      }
    }
  }, [selectedProduct, products]);

  const handlePrint = async () => {
    if (!selectedProduct || !quantity) {
      alert("Please select a product and specify quantity before printing the sticker.");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
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

    for (let i = 0; i < parseInt(quantity); i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    }

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  };

  return (
    <div className="space-y-4">
      <div className="mb-6 bg-white p-4 rounded-md">
        <PrintableSticker
          sku={products.find(p => p.id === selectedProduct)?.barcode || 'SAMPLE SKU'}
          barcodeUrl={barcodeUrl}
          price={products.find(p => p.id === selectedProduct)?.sellingPrice || '0'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product" className="text-sky-400">Select Product:</Label>
        <Select onValueChange={setSelectedProduct} value={selectedProduct}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Printer className="mr-2 h-4 w-4" /> Generate Stickers
      </Button>
    </div>
  );
};

export default GenerateStickers;