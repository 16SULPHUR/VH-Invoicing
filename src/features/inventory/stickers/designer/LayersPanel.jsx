import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Filter,
  ImagePlus,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createElement } from "../designModel";
import { readImageFile } from "../images";
import { IconButton, Section } from "./fields";
import { TYPE_ICONS } from "./screen";


const TOOLS = [
  { type: "text", label: "Text" },
  { type: "qr", label: "QR" },
  { type: "barcode", label: "Barcode" },
  { type: "image", label: "Logo" },
  { type: "line", label: "Line" },
  { type: "box", label: "Box" },
  { type: "ellipse", label: "Ellipse" },
];

/** Adds an object centred on the label. */
function centred(type, size) {
  const element = createElement(type);
  const w = Math.min(element.w, size.width - 2);
  const h = type === "qr" ? Math.min(w, size.height - 2) : Math.min(element.h, size.height - 2);
  const width = type === "qr" ? h : w;
  return { ...element, w: width, h, x: Math.round(((size.width - width) / 2) * 10) / 10, y: Math.round(((size.height - h) / 2) * 10) / 10 };
}

export function AddObjects({ design, onAdd }) {
  const fileRef = useRef(null);
  const { toast } = useToast();

  const addGuide = async (file) => {
    if (!file) return;
    try {
      const { src, aspect } = await readImageFile(file, { guide: true });
      const { width, height } = design.size;
      onAdd(
        createElement("image", { name: "Guide photo", src, aspect, fit: "contain", align: "center", guide: true, locked: true, x: 0, y: 0, w: width, h: height }),
        { atBottom: true }
      );
    } catch (error) {
      toast({ variant: "destructive", title: "Photo not added", description: error.message });
    }
  };

  return (
    <Section title="Add">
      <div className="grid grid-cols-4 gap-1.5">
        {TOOLS.map(({ type, label }) => {
          const Icon = TYPE_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(centred(type, design.size))}
              className="press flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-border bg-surface text-[11px] font-bold text-foreground transition-colors hover:border-rani/40 hover:text-rani"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="A photo of the tag to design over. It never prints."
          className="press flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-border bg-surface text-[11px] font-bold text-muted-foreground transition-colors hover:border-rani/40 hover:text-rani"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Guide
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            addGuide(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </Section>
  );
}

export function LayersPanel({ design, selectedIds, onSelect, onPatch, onReorder, onMoveTo, onDuplicate, onDelete }) {
  const [renaming, setRenaming] = useState(null);
  const [dragging, setDragging] = useState(null);
  const layers = [...design.elements].reverse();
  const hasSelection = selectedIds.length > 0;

  const pick = (event, id) => {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      onSelect(selectedIds.includes(id) ? selectedIds.filter((other) => other !== id) : [...selectedIds, id]);
    } else onSelect([id]);
  };

  return (
    <Section
      title={`Layers · ${design.elements.length}`}
      action={
        <div className="-my-1 flex items-center">
          <IconButton label="Bring forward" disabled={!hasSelection} onClick={() => onReorder(1)}>
            <ArrowUp />
          </IconButton>
          <IconButton label="Send backward" disabled={!hasSelection} onClick={() => onReorder(-1)}>
            <ArrowDown />
          </IconButton>
          <IconButton label="Duplicate (Ctrl+D)" disabled={!hasSelection} onClick={onDuplicate}>
            <Copy />
          </IconButton>
          <IconButton label="Delete (Del)" disabled={!hasSelection} onClick={onDelete} className="hover:text-destructive">
            <Trash2 />
          </IconButton>
        </div>
      }
    >
      {layers.length === 0 ? (
        <p className="rounded-xl border-[1.5px] border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
          Empty label. Add text, a QR code or the logo above.
        </p>
      ) : (
        <ul className="space-y-0.5" aria-label="Layers, top first">
          {layers.map((element) => {
            const Icon = element.guide ? ImagePlus : TYPE_ICONS[element.type];
            const selected = selectedIds.includes(element.id);
            const toIndex = design.elements.findIndex(({ id }) => id === element.id);
            return (
              <li
                key={element.id}
                draggable={renaming !== element.id}
                onDragStart={(event) => {
                  setDragging(element.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => dragging && event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragging && dragging !== element.id) onMoveTo(dragging, toIndex);
                  setDragging(null);
                }}
                onDragEnd={() => setDragging(null)}
                className={cn(
                  "group flex h-9 items-center gap-1 rounded-lg pl-2 pr-0.5 transition-colors",
                  selected ? "bg-indigo text-white" : "hover:bg-secondary",
                  element.hidden && !selected && "text-muted-foreground",
                  dragging === element.id && "opacity-40"
                )}
              >
                <button
                  type="button"
                  onClick={(event) => pick(event, element.id)}
                  onDoubleClick={() => setRenaming(element.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-marigold" : "text-muted-foreground")} aria-hidden />
                  {renaming === element.id ? (
                    <input
                      autoFocus
                      defaultValue={element.name}
                      aria-label="Layer name"
                      onClick={(event) => event.stopPropagation()}
                      onBlur={(event) => {
                        onPatch(element.id, { name: event.target.value.trim() || element.name });
                        setRenaming(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") setRenaming(null);
                      }}
                      className="h-7 min-w-0 flex-1 rounded-md bg-surface px-1.5 text-[13px] text-foreground outline-none ring-2 ring-rani/40"
                    />
                  ) : (
                    <span className="truncate text-[13px] font-semibold">{element.name}</span>
                  )}
                  {element.condition?.op && <Filter className="h-3 w-3 shrink-0 opacity-70" aria-label="Shown by a rule" />}
                  {element.guide && <span className={cn("shrink-0 text-[10px] font-bold uppercase", selected ? "text-indigo-foreground" : "text-muted-foreground")}>guide</span>}
                </button>
                <IconButton
                  label={element.hidden ? `Show ${element.name}` : `Hide ${element.name}`}
                  onClick={() => onPatch(element.id, { hidden: !element.hidden })}
                  className={cn("h-7 w-7", selected && "text-indigo-foreground hover:bg-indigo-raised hover:text-white", !element.hidden && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}
                >
                  {element.hidden ? <EyeOff /> : <Eye />}
                </IconButton>
                <IconButton
                  label={element.locked ? `Unlock ${element.name}` : `Lock ${element.name}`}
                  onClick={() => onPatch(element.id, { locked: !element.locked })}
                  className={cn("h-7 w-7", selected && "text-indigo-foreground hover:bg-indigo-raised hover:text-white", !element.locked && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}
                >
                  {element.locked ? <Lock /> : <Unlock />}
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
