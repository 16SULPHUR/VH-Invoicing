import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Moveable from "react-moveable";
import Selecto from "react-selecto";
import { Maximize, Minus, Plus } from "lucide-react";
import { LabelFace } from "../LabelRenderer";
import { CLEAR_TAG_BACKGROUND, PX_PER_MM, ZOOM_STEPS } from "./screen";

const PAD = 44;
const RULER = 20;

const toMm = (px, scale) => Math.round((px / scale) * 100) / 100;
const normalizeAngle = (degrees) => Math.round((((degrees % 360) + 360) % 360) * 10) / 10;

function Ruler({ vertical, length, scale, highlight }) {
  const from = -5;
  const to = Math.ceil(length) + 5;
  const ticks = [];
  for (let mm = from; mm <= to; mm += 1) {
    const major = mm % 10 === 0;
    const mid = mm % 5 === 0;
    if (!major && !mid && scale < 4) continue;
    const size = major ? 9 : mid ? 6 : 3.5;
    const at = (mm - from) * scale + 0.5;
    ticks.push(
      vertical ? (
        <g key={mm}>
          <line x1={RULER - size} x2={RULER} y1={at} y2={at} />
          {major && (
            <text x={RULER - 11} y={at + 2} transform={`rotate(-90 ${RULER - 11} ${at + 2})`} textAnchor="start">
              {mm}
            </text>
          )}
        </g>
      ) : (
        <g key={mm}>
          <line y1={RULER - size} y2={RULER} x1={at} x2={at} />
          {major && (
            <text x={at + 2} y={RULER - 11}>
              {mm}
            </text>
          )}
        </g>
      )
    );
  }
  const span = (to - from) * scale;
  const band = highlight && (
    <rect
      x={vertical ? 0 : (highlight[0] - from) * scale}
      y={vertical ? (highlight[0] - from) * scale : 0}
      width={vertical ? RULER : (highlight[1] - highlight[0]) * scale}
      height={vertical ? (highlight[1] - highlight[0]) * scale : RULER}
      className="fill-rani/20"
    />
  );
  return (
    <svg
      aria-hidden
      width={vertical ? RULER : span}
      height={vertical ? span : RULER}
      className="pointer-events-none absolute select-none text-[9px] font-semibold [&_line]:stroke-muted-foreground/60 [&_text]:fill-muted-foreground"
      style={vertical ? { left: -RULER - 6, top: from * scale } : { top: -RULER - 6, left: from * scale }}
    >
      {band}
      {ticks}
    </svg>
  );
}

/** The design board: the label at true size (100% = real millimetres on a 96 dpi screen). */
export function Board({ design, scope, selectedIds, onSelect, onChange, onGestureEnd, zoom, onZoom, background, showGrid, snap, onEditText }) {
  const viewportRef = useRef(null);
  const labelRef = useRef(null);
  const moveableRef = useRef(null);
  const [viewport, setViewport] = useState(null);
  const [fitScale, setFitScale] = useState(4);
  const [targets, setTargets] = useState([]);
  const [others, setOthers] = useState([]);

  const { width, height } = design.size;

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    setViewport(element);
    const measure = () => {
      const available = Math.min(
        (element.clientWidth - PAD * 2 - RULER) / (width * PX_PER_MM),
        (element.clientHeight - PAD * 2 - RULER) / (height * PX_PER_MM)
      );
      setFitScale(Math.max(0.5, Math.min(8, Math.floor(available * 20) / 20)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  const factor = zoom === "fit" ? fitScale : zoom;
  const scale = factor * PX_PER_MM;

  const byId = useMemo(() => new Map(design.elements.map((element) => [element.id, element])), [design.elements]);
  const movable = selectedIds.filter((id) => byId.get(id) && !byId.get(id).locked && !byId.get(id).hidden);
  const single = movable.length === 1 ? byId.get(movable[0]) : null;

  const movableKey = movable.join(",");
  useLayoutEffect(() => {
    const root = labelRef.current;
    if (!root) return;
    const ids = movableKey ? movableKey.split(",") : [];
    const nodes = ids.map((id) => root.querySelector(`[data-el="${id}"]`)).filter(Boolean);
    setTargets((previous) => (previous.length === nodes.length && previous.every((node, i) => node === nodes[i]) ? previous : nodes));
    const rest = [...root.querySelectorAll("[data-el]")].filter((node) => !ids.includes(node.dataset.el));
    setOthers((previous) => (previous.length === rest.length && previous.every((node, i) => node === rest[i]) ? previous : rest));
  }, [movableKey, design.elements]);

  useLayoutEffect(() => {
    moveableRef.current?.updateRect();
  }, [design, scale, targets]);

  const idOf = (target) => target.dataset.el;
  const emit = useCallback((changes) => onChange(changes, { transient: true }), [onChange]);

  const selection = useMemo(() => {
    const boxes = selectedIds.map((id) => byId.get(id)).filter(Boolean);
    if (boxes.length === 0) return null;
    return {
      x: [Math.min(...boxes.map((b) => b.x)), Math.max(...boxes.map((b) => b.x + b.w))],
      y: [Math.min(...boxes.map((b) => b.y)), Math.max(...boxes.map((b) => b.y + b.h))],
    };
  }, [selectedIds, byId]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const next = factor * (event.deltaY < 0 ? 1.15 : 1 / 1.15);
      onZoom(Math.max(1, Math.min(8, Math.round(next * 20) / 20)));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [factor, onZoom]);

  const stepZoom = (direction) => {
    const next = direction > 0 ? ZOOM_STEPS.find((step) => step > factor + 0.01) : [...ZOOM_STEPS].reverse().find((step) => step < factor - 0.01);
    onZoom(next ?? (direction > 0 ? 8 : 1));
  };

  const labelPx = { width: width * scale, height: height * scale };
  const gridMinor = scale >= 6 ? 1 : 5;

  return (
    <div className="relative h-full min-h-0 w-full">
      <div ref={viewportRef} className="designer-viewport h-full w-full overflow-auto">
        <div className="grid min-h-full place-items-center" style={{ padding: PAD, paddingTop: PAD + RULER / 2, paddingLeft: PAD + RULER / 2, width: "max-content", minWidth: "100%" }}>
          <div className="relative" style={labelPx} onDoubleClick={(event) => {
            const id = event.target.closest?.("[data-el]")?.dataset.el;
            if (id && byId.get(id)?.type === "text") onEditText?.(id);
          }}>
            <Ruler length={width} scale={scale} highlight={selection?.x} />
            <Ruler vertical length={height} scale={scale} highlight={selection?.y} />
            <div
              className="absolute inset-0 shadow-[0_1px_2px_rgb(0_0_0/.12),0_8px_24px_-8px_rgb(40_20_90/.35)]"
              style={{ borderRadius: (design.size.radius ?? 0) * scale, ...(background === "clear" ? CLEAR_TAG_BACKGROUND : { background: "#fff" }) }}
            />
            {showGrid && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  borderRadius: (design.size.radius ?? 0) * scale,
                  backgroundImage:
                    `linear-gradient(to right, rgb(60 40 140 / .16) 1px, transparent 1px),linear-gradient(to bottom, rgb(60 40 140 / .16) 1px, transparent 1px),` +
                    `linear-gradient(to right, rgb(60 40 140 / .07) 1px, transparent 1px),linear-gradient(to bottom, rgb(60 40 140 / .07) 1px, transparent 1px)`,
                  backgroundSize: `${scale * 10}px ${scale * 10}px, ${scale * 10}px ${scale * 10}px, ${scale * gridMinor}px ${scale * gridMinor}px, ${scale * gridMinor}px ${scale * gridMinor}px`,
                }}
              />
            )}
            <div ref={labelRef} className="absolute inset-0">
              <LabelFace design={design} scope={scope} mode="design" unit={`${scale}px`} background="transparent" />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo/15" style={{ borderRadius: (design.size.radius ?? 0) * scale }} />
            <Moveable
              ref={moveableRef}
              className="vh-moveable"
              target={targets.length === 1 ? targets[0] : targets}
              draggable
              resizable
              rotatable={Boolean(single)}
              keepRatio={single?.type === "qr"}
              throttleDrag={0}
              throttleResize={0}
              throttleRotate={0}
              rotationPosition="top"
              origin={false}
              snappable={snap}
              snapContainer={labelRef.current}
              snapThreshold={5}
              snapGap
              isDisplaySnapDigit
              snapRotationDegrees={[0, 90, 180, 270]}
              snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
              elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
              verticalGuidelines={[0, (width / 2) * scale, width * scale]}
              horizontalGuidelines={[0, (height / 2) * scale, height * scale]}
              elementGuidelines={others}
              onDrag={({ target, left, top }) => emit({ [idOf(target)]: { x: toMm(left, scale), y: toMm(top, scale) } })}
              onDragEnd={onGestureEnd}
              onDragGroup={({ events }) =>
                emit(Object.fromEntries(events.map(({ target, left, top }) => [idOf(target), { x: toMm(left, scale), y: toMm(top, scale) }])))
              }
              onDragGroupEnd={onGestureEnd}
              onResize={({ target, width: w, height: h, drag }) =>
                emit({ [idOf(target)]: { w: Math.max(0.1, toMm(w, scale)), h: Math.max(0.1, toMm(h, scale)), x: toMm(drag.left, scale), y: toMm(drag.top, scale) } })
              }
              onResizeEnd={onGestureEnd}
              onResizeGroup={({ events }) =>
                emit(
                  Object.fromEntries(
                    events.map(({ target, width: w, height: h, drag }) => [
                      idOf(target),
                      { w: Math.max(0.1, toMm(w, scale)), h: Math.max(0.1, toMm(h, scale)), x: toMm(drag.left, scale), y: toMm(drag.top, scale) },
                    ])
                  )
                )
              }
              onResizeGroupEnd={onGestureEnd}
              onRotate={({ target, rotation }) => emit({ [idOf(target)]: { rotation: normalizeAngle(rotation) } })}
              onRotateEnd={onGestureEnd}
            />
          </div>
        </div>
      </div>

      {viewport && (
        <Selecto
          dragContainer={viewport}
          selectableTargets={[".designer-viewport .vhl-el:not(.vhl-locked)"]}
          hitRate={0}
          selectByClick
          selectFromInside={false}
          toggleContinueSelect={["shift"]}
          ratio={0}
          onDragStart={(event) => {
            const target = event.inputEvent.target;
            if (moveableRef.current?.isMoveableElement(target) || targets.some((node) => node === target || node.contains(target))) {
              event.stop();
            }
          }}
          onSelectEnd={(event) => {
            onSelect(event.selected.map(idOf));
            if (event.isDragStart && event.selected.length > 0) {
              event.inputEvent.preventDefault();
              moveableRef.current?.waitToChangeTarget().then(() => moveableRef.current?.dragStart(event.inputEvent));
            }
          }}
        />
      )}

      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-xl border border-border bg-surface/95 p-1 shadow-sm backdrop-blur">
        <button type="button" aria-label="Zoom out" onClick={() => stepZoom(-1)} className="press grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <select
          aria-label="Zoom"
          value={zoom === "fit" ? "fit" : String(zoom)}
          onChange={(event) => onZoom(event.target.value === "fit" ? "fit" : Number(event.target.value))}
          className="h-7 rounded-lg bg-transparent px-1 text-xs font-bold tabular-nums"
        >
          <option value="fit">Fit · {Math.round(fitScale * 100)}%</option>
          {ZOOM_STEPS.map((step) => (
            <option key={step} value={String(step)}>
              {step * 100}%
            </option>
          ))}
          {zoom !== "fit" && !ZOOM_STEPS.includes(zoom) && <option value={String(zoom)}>{Math.round(zoom * 100)}%</option>}
        </select>
        <button type="button" aria-label="Zoom in" onClick={() => stepZoom(1)} className="press grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Fit to screen" title="Fit" onClick={() => onZoom("fit")} className="press grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
