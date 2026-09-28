import { Camera, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/config/navigation";

export function CameraPanel({ camera }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          {camera.devices.length > 1 && (
            <select
              aria-label="Camera"
              className="h-10 max-w-[12rem] rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 text-sm"
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
            <Button onClick={camera.stop} variant="outline">
              Stop scanning
            </Button>
          ) : (
            <Button onClick={camera.start} variant="rani">
              <Camera className="mr-2 h-4 w-4" /> Start scanning
            </Button>
          )}
        </div>
      </div>

      {camera.error && (
        <Alert variant="destructive">
          <AlertTitle>Camera error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{camera.error}</span>
            <Button variant="outline" size="sm" onClick={camera.retry}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#3a3052] to-indigo">
        <video
          ref={camera.videoRef}
          className={`h-full w-full object-cover ${camera.isScanning ? "block" : "hidden"}`}
        />
        {camera.isScanning && camera.isVideoReady && (
          <div className="absolute inset-0">
            <div className="absolute bottom-1/3 left-[18%] right-[18%] top-1/3 rounded-2xl border-[3px] border-marigold">
              <div className="absolute left-2.5 right-2.5 top-1/2 h-0.5 bg-rani shadow-[0_0_12px_hsl(var(--rani))]" />
            </div>
          </div>
        )}
        {!camera.isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Camera size={28} strokeWidth={ICON_STROKE} className="text-marigold" aria-hidden />
            <p className="font-display text-lg font-bold text-white">Camera is off</p>
            <p className="text-xs text-indigo-foreground">Start scanning to read barcodes.</p>
          </div>
        )}
        {camera.isScanning && !camera.isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-marigold" />
          </div>
        )}
      </div>
    </div>
  );
}
