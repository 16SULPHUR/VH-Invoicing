import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const BarcodeScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const streamInterval = useRef(null);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [videoInitialized, setVideoInitialized] = useState(false);

  const getDeviceList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDeviceList(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting device list:', err);
      setError('Unable to get camera list. Please check your browser permissions.');
    }
  };

  const initializeVideo = async () => {
    if (!videoRef.current) {
      console.error('Video element not initialized');
      return false;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          facingMode: selectedDevice ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      
      return new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setVideoInitialized(true);
              resolve(true);
            })
            .catch(err => {
              console.error('Error playing video:', err);
              resolve(false);
            });
        };
      });
    } catch (err) {
      console.error('Error initializing video:', err);
      return false;
    }
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      // Clean up any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Initialize video with retry logic
      let initSuccess = false;
      for (let i = 0; i < 3; i++) {  // Try up to 3 times
        initSuccess = await initializeVideo();
        if (initSuccess) break;
        await new Promise(resolve => setTimeout(resolve, 1000));  // Wait 1 second between attempts
      }

      if (!initSuccess) {
        throw new Error('Failed to initialize video after multiple attempts');
      }

      // Start simulated barcode detection
      streamInterval.current = setInterval(simulateBarcodeDetection, 3000);

    } catch (err) {
      console.error('Error starting scanner:', err);
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotReadableError') {
        errorMessage += 'The camera may be in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera device was found. Please connect a camera and try again.';
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Camera access is restricted by your browser security settings.';
      } else {
        errorMessage += err.message || 'Please check your camera connections and permissions.';
      }
      
      setError(errorMessage);
      setScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setVideoInitialized(false);
  };

  const retryConnection = async () => {
    stopScanning();
    await getDeviceList();
    startScanning();
  };

  const simulateBarcodeDetection = () => {
    const mockBarcode = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toLocaleString();
    setScannedItems(prev => [...prev, { barcode: mockBarcode, timestamp }]);
  };

  const clearScannedItems = () => {
    setScannedItems([]);
  };

  useEffect(() => {
    getDeviceList();
    
    return () => {
      stopScanning();
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
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
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
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
            />
            {scanning && videoInitialized && (
              <div className="absolute inset-0 border-2 border-blue-500 opacity-50 animate-pulse" />
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
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scannedItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{item.barcode}</TableCell>
                <TableCell>{item.timestamp}</TableCell>
              </TableRow>
            ))}
            {scannedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500">
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