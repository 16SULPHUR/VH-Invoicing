import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LabelFace } from "./LabelRenderer";
import { bakedLogo } from "./images";

// html2canvas measures each font's baseline with a hidden div and <img> on the live page;
// Tailwind's preflight (block images, 1.5 line height) would push all text down.
const METRICS_FIX =
  'body > div[style*="visibility: hidden"]{line-height:normal!important}' +
  'body > div[style*="visibility: hidden"] > img{display:inline!important}';

const LEVEL = {
  error: { icon: XCircle, className: "text-destructive", ring: "outline-destructive" },
  warn: { icon: AlertTriangle, className: "text-warning", ring: "outline-marigold" },
  info: { icon: Info, className: "text-indigo", ring: "outline-indigo/40" },
};

/**
 * What the thermal head will actually print: the label rasterised at the printer's dots per
 * inch and cut to pure black or white, with objects that may print badly outlined.
 */
export function DotPreview({ design, scope, dpi, checks, className }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("rendering");
  const { width, height } = design.size;

  useEffect(() => {
    let cancelled = false;
    setStatus("rendering");
    (async () => {
      await document.fonts.ready;
      const node = hostRef.current?.firstElementChild;
      if (!node) return;
      await Promise.all(
        [...node.querySelectorAll("img")].map((image) => image.complete || new Promise((resolve) => (image.onload = image.onerror = resolve)))
      );
      const [logo, { default: html2canvas }] = await Promise.all([bakedLogo().catch(() => null), import("html2canvas")]);
      const fix = document.createElement("style");
      fix.textContent = METRICS_FIX;
      document.head.appendChild(fix);
      const raster = await html2canvas(node, {
        scale: 1,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (doc) =>
          logo &&
          doc.querySelectorAll("img.vhl-logo").forEach((image) => {
            image.src = logo;
            image.style.filter = "none";
          }),
      }).finally(() => fix.remove());
      if (cancelled || !canvasRef.current) return;
      const context = raster.getContext("2d");
      const pixels = context.getImageData(0, 0, raster.width, raster.height);
      const { data } = pixels;
      for (let i = 0; i < data.length; i += 4) {
        const ink = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] < 128;
        data[i] = data[i + 1] = data[i + 2] = ink ? 0 : 255;
        data[i + 3] = 255;
      }
      const target = canvasRef.current;
      target.width = raster.width;
      target.height = raster.height;
      target.getContext("2d").putImageData(pixels, 0, 0);
      setStatus("ready");
    })().catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [design, scope, dpi]);

  const flagged = checks.filter((check) => check.id && check.level !== "info");
  const byId = new Map(design.elements.map((element) => [element.id, element]));

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div aria-hidden ref={hostRef} style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }}>
        <LabelFace design={design} scope={scope} unit={`${dpi / 25.4}px`} rounded={false} />
      </div>
      <div className="relative w-full max-w-[720px]" style={{ aspectRatio: `${width} / ${height}` }}>
        <canvas
          ref={canvasRef}
          aria-label={`Print preview at ${dpi} dpi`}
          className={cn("absolute inset-0 h-full w-full bg-white shadow-[0_8px_24px_-8px_rgb(40_20_90/.35)] transition-opacity", status !== "ready" && "opacity-40")}
          style={{ imageRendering: "pixelated" }}
        />
        {flagged.map((check, index) => {
          const element = byId.get(check.id);
          if (!element) return null;
          return (
            <div
              key={`${check.id}-${index}`}
              title={check.message}
              className={cn("pointer-events-none absolute outline outline-2 outline-offset-1", LEVEL[check.level].ring)}
              style={{
                left: `${(element.x / width) * 100}%`,
                top: `${(element.y / height) * 100}%`,
                width: `${(element.w / width) * 100}%`,
                height: `${(element.h / height) * 100}%`,
                transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
              }}
            />
          );
        })}
        {status === "error" && <p className="absolute inset-0 grid place-items-center text-sm text-destructive">Preview could not be drawn.</p>}
      </div>
      <ul className="w-full max-w-[720px] space-y-1.5" aria-label="Print checks">
        {checks.length === 0 ? (
          <li className="rounded-xl bg-leaf/10 px-3 py-2 text-sm font-semibold text-leaf">Everything is at least one dot wide and 5 pt or larger.</li>
        ) : (
          checks.map((check, index) => {
            const { icon: Icon, className: tone } = LEVEL[check.level];
            return (
              <li key={index} className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-[13px] shadow-[0_1px_0_hsl(var(--border))]">
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden />
                <span>
                  {check.id && <b>{check.name}: </b>}
                  {check.message}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
