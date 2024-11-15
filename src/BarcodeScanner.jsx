import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw } from "lucide-react";
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
  BrowserMultiFormatReader,
  NotFoundException,
  BarcodeFormat,
} from "@zxing/library";
import { supabase } from "./supabaseClient";

const BarcodeScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [videoInitialized, setVideoInitialized] = useState(false);
  const [canScan, setCanScan] = useState(true);

  const beep = new Audio("/beep.wav");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

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

            // Send scanned item to Supabase
            await sendScannedItemToSupabase(newScan.barcode);

            // Pause scanning for 1 second
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
    const response = await supabase.from("scanned_products").delete();
    setScannedItems([]);
  };

  const sendScannedItemToSupabase = async (barcode) => {
    try {
      const { data, error } = await supabase
        .from("scanned_products")
        .insert([{ name: barcode, quantity: 0, price: 0 }]);

      if (error) throw error;
      console.log("Scanned item sent to Supabase:", data);
    } catch (error) {
      console.error("Error sending scanned item to Supabase:", error);
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
              <Button onClick={clearScannedItems} variant="outline">
                Clear All
              </Button>
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

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scannedItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{item.barcode}</TableCell>
                <TableCell>{item.format}</TableCell>
                <TableCell>{item.timestamp}</TableCell>
              </TableRow>
            ))}
            {scannedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  No items scanned yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
