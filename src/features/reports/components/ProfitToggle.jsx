import { Eye, EyeOff } from "lucide-react";
import { useShowProfit } from "../hooks/useShowProfit";

export function ProfitToggle() {
  const [show, setShow] = useShowProfit();
  const Icon = show ? Eye : EyeOff;
  return (
    <button
      type="button"
      aria-pressed={show}
      onClick={() => setShow(!show)}
      title={show ? "Hide profit figures on this device" : "Show profit figures on this device"}
      className="press inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-surface px-3 text-xs font-bold hover:border-indigo/40"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      Profit {show ? "shown" : "hidden"}
    </button>
  );
}
