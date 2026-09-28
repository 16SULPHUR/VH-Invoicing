import { initialsFor, swatchFor } from "@/utils/swatch";

export function Monogram({ name, className = "h-10 w-10 text-[15px]" }) {
  return (
    <span
      className={`swatch grid shrink-0 after:opacity-50 place-items-center rounded-xl font-display font-extrabold text-white ${className}`}
      style={{ backgroundColor: swatchFor(name) }}
      aria-hidden
    >
      <span className="relative z-[1]">{initialsFor(name)}</span>
    </span>
  );
}
