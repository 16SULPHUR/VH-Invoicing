import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeFormat, BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

const SUPPORTED_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

const POSSIBLE_FORMATS_HINT = 2;
const RESCAN_COOLDOWN_MS = 1000;

const CAMERA_ERRORS = {
  NotReadableError: "The camera may be in use by another application.",
  NotAllowedError: "Camera permission was denied.",
  NotFoundError: "No camera device was found.",
  SecurityError: "Camera access is restricted.",
};

/**
 * Wraps ZXing's continuous decoder. `onDetected` fires at most once per
 * cooldown window so a barcode held in frame is not read repeatedly.
 */
export function useBarcodeCamera({ onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const canScanRef = useRef(true);
  const onDetectedRef = useRef(onDetected);

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);

  onDetectedRef.current = onDetected;

  const getReader = useCallback(() => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader();
      readerRef.current.hints = new Map([[POSSIBLE_FORMATS_HINT, SUPPORTED_FORMATS]]);
    }
    return readerRef.current;
  }, []);

  const listDevices = useCallback(async () => {
    try {
      const found = await getReader().listVideoInputDevices();
      const mapped = found.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
      }));

      setDevices(mapped);
      // Prefer the rear camera, which on most phones is the second entry.
      setSelectedDevice(
        (current) => current ?? mapped.at(mapped.length > 1 ? 1 : 0)?.deviceId ?? null
      );
    } catch (err) {
      console.error("Error initializing scanner:", err);
      setError("Failed to initialize barcode scanner. Please check camera permissions.");
    }
  }, [getReader]);

  const stop = useCallback(() => {
    readerRef.current?.reset();
    setIsScanning(false);
    setIsVideoReady(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      if (!videoRef.current) throw new Error("Video element not found");

      await getReader().decodeFromVideoDevice(selectedDevice, videoRef.current, (result, err) => {
        if (result && canScanRef.current) {
          canScanRef.current = false;
          setTimeout(() => {
            canScanRef.current = true;
          }, RESCAN_COOLDOWN_MS);

          onDetectedRef.current?.({
            barcode: result.getText(),
            format: result.getBarcodeFormat().toString(),
          });
        } else if (err && !(err instanceof NotFoundException)) {
          console.error("Scanning error:", err);
        }
      });

      setIsVideoReady(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(`Unable to access camera. ${CAMERA_ERRORS[err.name] ?? err.message ?? ""}`.trim());
      stop();
    }
  }, [getReader, selectedDevice, stop]);

  const retry = useCallback(async () => {
    stop();
    await listDevices();
    await start();
  }, [stop, listDevices, start]);

  const selectDevice = useCallback(
    (deviceId) => {
      setSelectedDevice(deviceId);
      if (isScanning) {
        stop();
        setTimeout(start, 100);
      }
    },
    [isScanning, stop, start]
  );

  useEffect(() => {
    listDevices();
    return () => readerRef.current?.reset();
  }, [listDevices]);

  return {
    videoRef,
    devices,
    selectedDevice,
    selectDevice,
    isScanning,
    isVideoReady,
    error,
    start,
    stop,
    retry,
  };
}
