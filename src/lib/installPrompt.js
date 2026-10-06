let deferred = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

const standalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

// Must be listening before the browser fires the event, so this runs at startup.
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installState() {
  if (installed || standalone()) return "installed";
  if (deferred) return "ready";
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return "ios";
  return "unavailable";
}

/** Shows the browser's own install dialog. Resolves true when the app was installed. */
export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  notify();
  return outcome === "accepted";
}
