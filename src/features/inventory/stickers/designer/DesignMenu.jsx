import { Check, ChevronDown, Copy, FilePlus2, Star, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describeSize } from "../labelStock";

/** Switch between saved designs and create, copy, delete or make one the default. */
export function DesignMenu({ design, designs, onOpen, onNew, onDuplicate, onMakeDefault, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Designs"
          className="press flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/15"
        >
          {designs.length} designs <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Saved designs</DropdownMenuLabel>
        {designs.map((candidate) => (
          <DropdownMenuItem key={candidate.id} onClick={() => onOpen(candidate.id)} className="gap-2">
            <Check className={`h-4 w-4 shrink-0 ${candidate.id === design.id ? "text-rani" : "opacity-0"}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{candidate.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{describeSize(candidate.size)}</span>
            </span>
            {candidate.is_default && <span className="rounded-full bg-marigold/25 px-2 py-0.5 text-[10px] font-bold">Default</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNew}>
          <FilePlus2 className="mr-2 h-4 w-4" /> New blank design
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate this design
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMakeDefault} disabled={design.is_default}>
          <Star className="mr-2 h-4 w-4" /> Make this the shop default
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} disabled={designs.length < 2} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete this design
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
