import { useSyncExternalStore } from "react";
import { installState, promptInstall, subscribe } from "@/lib/installPrompt";

export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribe, installState);
  return { state, install: promptInstall };
}
