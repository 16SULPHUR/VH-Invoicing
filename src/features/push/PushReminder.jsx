import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ICON_STROKE } from "@/config/navigation";
import { pushService } from "./pushService";

/** Turns the evening "Close the day" reminder on or off for this phone. */
export function PushReminder() {
  const { toast } = useToast();
  const [on, setOn] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pushService.isOn().then(setOn, () => setOn(false));
  }, []);

  if (!pushService.supported()) {
    return (
      <p className="text-xs text-muted-foreground">
        Reminders need the installed app on this phone (on iPhone: Add to Home Screen first).
      </p>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) await pushService.disable();
      else await pushService.enable();
      setOn(!on);
    } catch (error) {
      toast({ title: "Couldn't change reminders", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const Icon = on ? BellOff : Bell;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3.5 py-3">
      <p className="min-w-0 text-sm">
        <b className="block">Close the day reminder</b>
        <span className="text-xs text-muted-foreground">
          An evening notification on this phone with the drawer and dues to check.
        </span>
      </p>
      <Button type="button" variant={on ? "outline" : "rani"} size="sm" onClick={toggle} disabled={busy || on === null} className="shrink-0">
        <Icon size={15} strokeWidth={ICON_STROKE} className="mr-1.5" aria-hidden />
        {on ? "Turn off" : "Turn on"}
      </Button>
    </div>
  );
}
