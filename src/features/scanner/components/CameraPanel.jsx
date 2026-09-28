import { Camera, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/config/navigation";

export function CameraPanel({ camera }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
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

      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
        <video
          ref={camera.videoRef}
          className={`h-full w-full object-cover ${camera.isScanning ? "block" : "hidden"}`}
        />
        {camera.isScanning && camera.isVideoReady && (
          <div className="absolute inset-0">
            <div className="absolute bottom-1/3 left-1/4 right-1/4 top-1/3 border-2 border-primary opacity-50">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary opacity-50" />
              <div className="absolute bottom-0 left-1/2 top-0 w-0.5 bg-primary opacity-50" />
            </div>
          </div>
        )}
        {!camera.isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Camera
              size={28}
              strokeWidth={ICON_STROKE}
              className="text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">Camera is off</p>
            <p className="text-xs text-muted-foreground">Start scanning to read barcodes.</p>
          </div>
        )}
        {camera.isScanning && !camera.isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
