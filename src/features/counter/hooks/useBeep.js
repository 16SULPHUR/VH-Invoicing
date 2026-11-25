import { useCallback, useRef } from "react";

export function useBeep() {
  const beepRef = useRef(null);
  return useCallback(() => {
    if (!beepRef.current) beepRef.current = new Audio("/beep.wav");
    beepRef.current.currentTime = 0;
    // Autoplay rules can block it; a silent scan still counts.
    beepRef.current.play().catch(() => {});
  }, []);
}
