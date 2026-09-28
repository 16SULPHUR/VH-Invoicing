import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { encodeBarcode } from "./barcode";
import { fontStack, fontsVersion } from "./fonts";
import { renderTemplate } from "./expr";
import { LOGO_FILTER, LOGO_SRC } from "./images";
import { A4, perSheet, sheetSlot } from "./labelStock";
import { mm, round, textContent } from "./labelText";
import { PT, fitText } from "./textFit";
import { conditionHolds } from "./variables";


const INK = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };
const V_ALIGN = { top: "flex-start", middle: "center", bottom: "flex-end" };

function TextObject({ element, scope }) {
  const { lines, size } = fitText(textContent(element, scope), element);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: V_ALIGN[element.vAlign] ?? "flex-start",
        width: "100%",
        height: "100%",
        textAlign: element.align ?? "left",
        fontFamily: fontStack(element.fontId),
        fontWeight: element.fontWeight ?? 400,
        fontStyle: element.italic ? "italic" : "normal",
        fontSize: mm(size * PT),
        lineHeight: element.lineHeight ?? 1.15,
        letterSpacing: element.letterSpacing ? `${element.letterSpacing}em` : undefined,
        color: element.color ?? "#000",
        whiteSpace: "pre",
      }}
    >
      {lines.map((line, index) => (
        <div key={index}>{line || " "}</div>
      ))}
    </div>
  );
}

function QrObject({ element, scope }) {
  return (
    <QRCodeSVG
      value={renderTemplate(element.value, scope) || " "}
      level={element.ecLevel ?? "M"}
      marginSize={0}
      size={64}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}

function BarcodeObject({ element, scope, mode }) {
  const value = renderTemplate(element.value, scope);
  const { paths, modules, height, error } = encodeBarcode(element.symbology, value);
  if (error) {
    return mode === "design" ? (
      <div style={{ width: "100%", height: "100%", border: "0.2mm dashed #c00", color: "#c00", fontSize: mm(1.6), display: "grid", placeItems: "center", textAlign: "center", overflow: "hidden" }}>
        {error}
      </div>
    ) : null;
  }
  const textSize = element.showText ? (Number(element.textSize) || 5) * PT : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <svg
        viewBox={`0 0 ${modules} ${height}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ display: "block", width: "100%", flex: 1, minHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: paths }}
      />
      {element.showText && (
        <div style={{ fontFamily: fontStack("mono"), fontWeight: 700, fontSize: mm(textSize), lineHeight: 1.1, textAlign: "center", whiteSpace: "pre", letterSpacing: "0.08em" }}>
          {value}
        </div>
      )}
    </div>
  );
}

/** The drawn rectangle of an image inside its box, computed so print never depends on object-fit. */
function imageRect(element) {
  const { w, h } = element;
  const aspect = Number(element.aspect) || w / h;
  if (element.fit === "stretch" || !aspect) return { left: 0, top: 0, width: w, height: h };
  const width = aspect > w / h ? w : h * aspect;
  const height = aspect > w / h ? w / aspect : h;
  const left = element.align === "center" ? (w - width) / 2 : element.align === "right" ? w - width : 0;
  return { left, top: (h - height) / 2, width, height };
}

function ImageObject({ element }) {
  const rect = imageRect(element);
  const isLogo = element.src === "logo";
  return (
    <img
      src={isLogo ? LOGO_SRC : element.src}
      alt=""
      className={isLogo ? "vhl-logo" : undefined}
      style={{
        position: "absolute",
        left: mm(rect.left),
        top: mm(rect.top),
        width: mm(rect.width),
        height: mm(rect.height),
        maxWidth: "none",
        display: "block",
        filter: isLogo ? LOGO_FILTER : undefined,
      }}
    />
  );
}

function ShapeObject({ element }) {
  if (element.type === "line") {
    const background =
      element.dash === "dashed"
        ? `repeating-linear-gradient(90deg,#000 0 ${mm(element.h * 4)},transparent 0 ${mm(element.h * 7)})`
        : element.dash === "dotted"
          ? `repeating-linear-gradient(90deg,#000 0 ${mm(element.h)},transparent 0 ${mm(element.h * 2.5)})`
          : "#000";
    return <div style={{ width: "100%", height: "100%", background, ...INK }} />;
  }
  const stroke = Number(element.strokeWidth) || 0;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: stroke > 0 ? `${mm(stroke)} solid #000` : undefined,
        borderRadius: element.type === "ellipse" ? "50%" : mm(element.radius ?? 0),
        background: element.fill === "black" ? "#000" : element.fill === "white" ? "#fff" : undefined,
        ...INK,
      }}
    />
  );
}

const OBJECTS = { text: TextObject, qr: QrObject, barcode: BarcodeObject, image: ImageObject, line: ShapeObject, box: ShapeObject, ellipse: ShapeObject };

/**
 * One label, drawn from a design and one sticker's values. The designer canvas, every
 * preview and the print window all render through this, sized by the --mm unit.
 * mode: "design" also draws guide photos and dims objects whose rule is off.
 */
export function LabelFace({ design, scope, mode = "print", unit = "1mm", background = "#fff", rounded = mode !== "print", className, style }) {
  useSyncExternalStore(fontsVersion.subscribe, fontsVersion.get, fontsVersion.get);
  const { width, height, radius } = design.size;
  return (
    <div
      className={className}
      style={{
        "--mm": unit,
        position: "relative",
        width: mm(width),
        height: mm(height),
        overflow: "hidden",
        background,
        borderRadius: rounded ? mm(radius ?? 0) : undefined,
        color: "#000",
        fontFeatureSettings: "normal",
        fontKerning: "normal",
        lineHeight: 1.15,
        textRendering: "geometricPrecision",
        flexShrink: 0,
        ...style,
      }}
    >
      {design.elements.map((element) => {
        if (element.hidden) return null;
        const active = conditionHolds(element.condition, scope);
        if (mode !== "design" && (element.guide || !active)) return null;
        const Kind = OBJECTS[element.type];
        if (!Kind) return null;
        return (
          <div
            key={element.id}
            data-el={element.id}
            className={mode === "design" ? `vhl-el${element.locked ? " vhl-locked" : ""}` : undefined}
            style={{
              position: "absolute",
              left: mm(element.x),
              top: mm(element.y),
              width: mm(element.w),
              height: mm(element.h),
              transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
              opacity: element.guide ? 0.45 : active ? undefined : 0.25,
              pointerEvents: element.guide && element.locked ? "none" : undefined,
            }}
          >
            <Kind element={element} scope={scope} mode={mode} />
          </div>
        );
      })}
    </div>
  );
}

const pageName = (size) => `vhl-${String(size.width).replace(".", "_")}x${String(size.height).replace(".", "_")}`;

/**
 * Every sticker of a print run. Roll labels print one per page at the label size; sheet
 * labels are laid out on A4, skipping `startAt` used slots on the first sheet.
 * `offset` is this printer's alignment in mm.
 */
export function LabelPrintSheet({ labels, offset = { x: 0, y: 0 }, startAt = 0 }) {
  const shift = offset.x || offset.y ? `translate(${round(offset.x)}mm, ${round(offset.y)}mm)` : undefined;
  const pages = [];
  let sheet = null;

  labels.forEach(({ design, scope }, index) => {
    const { size } = design;
    if (size.stock !== "sheet") {
      sheet = null;
      pages.push({ key: index, size, name: pageName(size), items: [{ design, scope, x: 0, y: 0 }] });
      return;
    }
    const capacity = perSheet(size);
    if (!sheet || sheet.designSize !== size || sheet.used >= capacity) {
      const first = !pages.some((page) => page.sheet);
      sheet = { key: index, sheet: true, designSize: size, size: A4, name: "vhl-a4", used: first ? Math.min(startAt, capacity - 1) : 0, items: [] };
      pages.push(sheet);
    }
    sheet.items.push({ design, scope, ...sheetSlot(size, sheet.used) });
    sheet.used += 1;
  });

  const names = new Map(pages.map((page) => [page.name, page.size]));
  const css =
    [...names]
      .map(([name, size]) => `@page ${name}{size:${size.width}mm ${size.height}mm;margin:0}`)
      .join("") +
    ".vhl-page{position:relative;overflow:hidden;break-after:page;page-break-after:always}" +
    ".vhl-page:last-child{break-after:auto;page-break-after:auto}";

  return (
    <div>
      <style>{css}</style>
      {pages.map((page) => (
        <div key={page.key} className="vhl-page" style={{ page: page.name, width: `${page.size.width}mm`, height: `${page.size.height}mm` }}>
          <div style={{ position: "absolute", inset: 0, transform: shift }}>
            {page.items.map(({ design, scope, x, y }, index) => (
              <div key={index} style={{ position: "absolute", left: `${round(x)}mm`, top: `${round(y)}mm` }}>
                <LabelFace design={design} scope={scope} background="transparent" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A border box and crosshair at the label size, to check the printer's alignment. */
export function AlignmentTestSheet({ size, offset = { x: 0, y: 0 } }) {
  const line = { position: "absolute", background: "#000", ...INK };
  const onSheet = size.stock === "sheet";
  const page = onSheet ? A4 : size;
  const slot = onSheet ? sheetSlot(size, 0) : { x: 0, y: 0 };
  const signed = (value) => `${value >= 0 ? "+" : ""}${Number(value).toFixed(1)}`;
  return (
    <div>
      <style>{`@page{size:${page.width}mm ${page.height}mm;margin:0}`}</style>
      <div style={{ position: "relative", width: `${page.width}mm`, height: `${page.height}mm`, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: `${slot.x}mm`,
            top: `${slot.y}mm`,
            width: `${size.width}mm`,
            height: `${size.height}mm`,
            transform: `translate(${round(offset.x)}mm, ${round(offset.y)}mm)`,
            border: "0.3mm solid #000",
            boxSizing: "border-box",
            fontFamily: fontStack("mono"),
            ...INK,
          }}
        >
          <div style={{ ...line, left: "50%", top: 0, bottom: 0, width: "0.25mm", marginLeft: "-0.125mm" }} />
          <div style={{ ...line, top: "50%", left: 0, right: 0, height: "0.25mm", marginTop: "-0.125mm" }} />
          <div style={{ position: "absolute", left: "1mm", top: "1mm", fontSize: "2mm", fontWeight: 700, lineHeight: 1.2 }}>
            X {signed(offset.x)} mm
            <br />
            Y {signed(offset.y)} mm
          </div>
        </div>
      </div>
    </div>
  );
}
