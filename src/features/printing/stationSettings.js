const KEY = "vh-print-station";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function loadStationSettings({ isMobile }) {
  const saved = read();
  const settings = {
    id: saved.id || crypto.randomUUID(),
    name: saved.name || "Till",
    enabled: saved.enabled ?? !isMobile,
  };
  saveStationSettings(settings);
  return settings;
}

export function saveStationSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private windows can refuse storage; the defaults still work for this visit.
  }
}
