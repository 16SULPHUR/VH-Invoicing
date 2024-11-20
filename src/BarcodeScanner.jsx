import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BrowserMultiFormatReader,
  NotFoundException,
  BarcodeFormat,
} from "@zxing/library";
import { supabase } from "./supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function Component() {
  const [scannedItems, setScannedItems] = useState([]);
  const [allproducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [videoInitialized, setVideoInitialized] = useState(false);
  const [canScan, setCanScan] = useState(true);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedQuantity, setScannedQuantity] = useState(1);
  const [scannedPrice, setScannedPrice] = useState(0);

  const { toast } = useToast();

  const beep = new Audio("/beep.wav");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, quantity, sellingPrice, supplier, barcode");

      if (productsError)
        console.error("Error fetching products:", productsError);
      else setAllProducts(productsData);
    };

    fetchData();
  }, []);

  const handleScannedProduct = (barcode, quantity, price) => {
    const existingProduct = allproducts?.find(p => p.barcode.toString() === barcode);

    if (!existingProduct) {
      toast({
        title: "Error",
        description: "Product not found in catalog",
        variant: "destructive"
      });
      return;
    }

    setItems(prevProducts => {
      const existingIndex = prevProducts.findIndex(p => p.barcode === barcode);

      if (existingIndex !== -1) {
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          quantity: updatedProducts[existingIndex].quantity + quantity,
          price: price,
          amount: (updatedProducts[existingIndex].quantity + quantity) * price,
        };
        return updatedProducts;
      } else {
        return [{
          name: existingProduct.name,
          barcode: barcode,
          quantity: quantity,
          price: price,
          amount: quantity * price,
        }, ...prevProducts];
      }
    });

    toast({
      title: "Product Scanned",
      description: `${existingProduct.name} has been added to the invoice.`,
    });
  };

  useEffect(() => {
    fetchScannedProducts();

    const scannedProductsSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scanned_products" },
        (payload) => {
          handleScannedProduct(payload.new.name, payload.new.quantity, payload.new.price);
        }
      )
      .subscribe();

    return () => {
      scannedProductsSubscription.unsubscribe();
    };
  }, [allproducts]);

  const fetchScannedProducts = async () => {
    try {
      const { data: scannedData, error } = await supabase
        .from("scanned_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const productMap = new Map();

      scannedData.forEach(scannedProduct => {
        const barcode = scannedProduct.name;
        const existingProduct = allproducts?.find(p => p?.barcode?.toString() === barcode.toString());

        if (!existingProduct) {
          console.warn(`Product with barcode ${barcode} not found in catalog`);
          return;
        }

        const quantity = scannedProduct.quantity || 1;
        const price = scannedProduct.price || 0;

        if (productMap.has(barcode)) {
          const product = productMap.get(barcode);
          product.quantity += quantity;
          product.amount = product.quantity * price;
        } else {
          productMap.set(barcode, {
            name: existingProduct.name,
            barcode: barcode,
            quantity: quantity,
            price: price,
            amount: quantity * price,
          });
        }
      });

      const formattedProducts = Array.from(productMap.values());

      setItems(formattedProducts);

      if (formattedProducts.length !== scannedData.length) {
        toast({
          title: "Warning",
          description: "Some scanned products were not found in the catalog",
          variant: "warning"
        });
      }

    } catch (error) {
      console.error("Error fetching scanned products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch scanned products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeScanner = async () => {
    try {
      codeReaderRef.current = new BrowserMultiFormatReader();

      if (!codeReaderRef.current.hints) {
        codeReaderRef.current.hints = new Map();
      }

      codeReaderRef.current.hints.set(2, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);

      const devices = await codeReaderRef.current.listVideoInputDevices();
      const videoDevices = devices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
      }));

      setDeviceList(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error initializing scanner:", err);
      setError(
        "Failed to initialize barcode scanner. Please check camera permissions."
      );
    }
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      if (!codeReaderRef.current) {
        await initializeScanner();
      }

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        async (result, err) => {
          if (result && canScan) {
            const existingProduct = allproducts?.find(p => p.barcode.toString() === result.getText());
            if(!existingProduct){
              return
            }
            stopScanning();
            setIsDialogOpen(true);

            const newScan = {
              barcode: result.getText(),
              format: result.getBarcodeFormat().toString(),
              timestamp: new Date().toLocaleString(),
            };

            setScannedItems((prev) => {
              beep.play().catch((e) => {
                console.log("Can't play audio", e);
              });
              return [...prev, newScan];
            });

            setScannedBarcode(newScan.barcode);

            setCanScan(false);
            setTimeout(() => setCanScan(true), 1000);
          } else if (err && !(err instanceof NotFoundException)) {
            console.error("Scanning error:", err);
          }
        }
      );

      setVideoInitialized(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      let errorMessage = "Unable to access camera. ";

      if (err.name === "NotReadableError") {
        errorMessage += "The camera may be in use by another application.";
      } else if (err.name === "NotAllowedError") {
        errorMessage += "Camera permission was denied.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera device was found.";
      } else if (err.name === "SecurityError") {
        errorMessage += "Camera access is restricted.";
      } else {
        errorMessage += err.message || "Please check your camera connections.";
      }

      setError(errorMessage);
      setScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setScanning(false);
    setVideoInitialized(false);
  };

  const retryConnection = async () => {
    stopScanning();
    await initializeScanner();
    startScanning();
  };

  const clearScannedItems = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("scanned_products")
        .delete()
        .neq("id", 0);
      
      if (error) throw error;

      setScannedItems([]);
      setItems([]);
      toast({
        title: "All Items Cleared",
        description: "All scanned items have been removed from the inventory.",
      });
    } catch (error) {
      console.error("Error clearing scanned items:", error);
      toast({
        title: "Error",
        description: "Failed to clear scanned items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendScannedItemToSupabase = async (barcode, quantity, price) => {
    try {
      const { data, error } = await supabase
        .from("scanned_products")
        .insert([{ name: barcode, quantity: quantity, price: price }]);

      if (error) throw error;
      console.log("Scanned item sent to Supabase:", data);
    } catch (error) {
      console.error("Error sending scanned item to Supabase:", error);
    }
  };

  const deleteItem = async (barcode) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("scanned_products")
        .delete()
        .eq("name", barcode);

      if (error) throw error;

      setItems(prevItems => prevItems.filter(item => item.barcode !== barcode));
      toast({
        title: "Item Deleted",
        description: "The item has been removed from the inventory.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeScanner();
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const handleDialogSubmit = async () => {
    await sendScannedItemToSupabase(scannedBarcode, scannedQuantity, scannedPrice);
    handleScannedProduct(scannedBarcode, scannedQuantity, scannedPrice);
    startScanning();
    setIsDialogOpen(false);
    setScannedQuantity(1);
    setScannedPrice(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Barcode Scanner</h2>
            <div className="space-x-2">
              {deviceList.length > 1 && (
                <select
                  className="p-2 border rounded"
                  value={selectedDevice}
                  onChange={(e) => {
                    setSelectedDevice(e.target.value);
                    if (scanning) {
                      stopScanning();
                      setTimeout(startScanning, 100);
                    }
                  }}
                >
                  {deviceList.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              )}
              {!scanning ? (
                <Button onClick={startScanning}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive">
                  Stop Scanning
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Camera Error</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={retryConnection}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${
                scanning ? "block" : "hidden"
              }`}
            />
            {scanning && videoInitialized && (
              <div className="absolute inset-0">
                <div className="absolute left-1/4 right-1/4 top-1/3 bottom-1/3 border-2 border-blue-500 opacity-50">
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-500 opacity-50" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 opacity-50" />
                </div>
              </div>
            )}
            {scanning && !videoInitialized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Inventory Items</h2>
          <div className="flex gap-3">
            <Button onClick={fetchScannedProducts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
            <Button className="bg-red-600" onClick={clearScannedItems} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Clear All'}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.barcode}>
                  <TableCell className="font-mono">{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteItem(item.barcode)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No items found in the inventory
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {loading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Product Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={scannedQuantity}
                onChange={(e) => setScannedQuantity(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={scannedPrice}
                onChange={(e) => setScannedPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleDialogSubmit}>
              Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}