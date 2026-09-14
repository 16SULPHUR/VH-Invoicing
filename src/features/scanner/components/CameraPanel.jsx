import { Camera, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CameraPanel({ camera }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Barcode Scanner</h2>
        <div className="space-x-2">
          {camera.devices.length > 1 && (
            <select
              aria-label="Camera"
              className="rounded border p-2"
              value={camera.selectedDevice ?? ""}
              onChange={(event) => camera.selectDevice(event.target.value)}
            >
              {camera.devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          )}
          {camera.isScanning ? (
            <Button onClick={camera.stop} variant="destructive">
              Stop Scanning
            </Button>
          ) : (
            <Button onClick={camera.start}>
              <Camera className="mr-2 h-4 w-4" /> Start Scanning
            </Button>
          )}
        </div>
      </div>

      {camera.error && (
        <Alert variant="destructive">
          <AlertTitle>Camera Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{camera.error}</span>
            <Button variant="outline" size="sm" onClick={camera.retry}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
        <video
          ref={camera.videoRef}
          className={`h-full w-full object-cover ${camera.isScanning ? "block" : "hidden"}`}
        />
        {camera.isScanning && camera.isVideoReady && (
          <div className="absolute inset-0">
            <div className="absolute bottom-1/3 left-1/4 right-1/4 top-1/3 border-2 border-pink-500 opacity-50">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-pink-500 opacity-50" />
              <div className="absolute bottom-0 left-1/2 top-0 w-0.5 bg-pink-500 opacity-50" />
            </div>
          </div>
        )}
        {camera.isScanning && !camera.isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500" />
          </div>
        )}
      </div>
    </div>
  );
}
