/** Label stock presets. Sizes in mm. Roll labels print one per page; sheets lay out on A4. */
export const ROLL_PRESETS = [
  { id: "roll-2x1", label: "2 × 1 in (50.8 × 25.4)", width: 50.8, height: 25.4, gap: 3 },
  { id: "roll-50x25", label: "50 × 25 mm", width: 50, height: 25, gap: 2 },
  { id: "roll-50x30", label: "50 × 30 mm", width: 50, height: 30, gap: 2 },
  { id: "roll-38x25", label: "38 × 25 mm", width: 38, height: 25, gap: 2 },
  { id: "roll-40x30", label: "40 × 30 mm", width: 40, height: 30, gap: 2 },
];

export const SHEET_PRESETS = [
  { id: "a4-65", label: "A4 65-up (38.1 × 21.2)", width: 38.1, height: 21.2, columns: 5, rows: 13, top: 10.7, left: 4.65, gapX: 2.5, gapY: 0 },
  { id: "a4-40", label: "A4 40-up (45.7 × 25.4)", width: 45.7, height: 25.4, columns: 4, rows: 10, top: 21.5, left: 9.75, gapX: 2.6, gapY: 0 },
  { id: "a4-24", label: "A4 24-up (63.5 × 33.9)", width: 63.5, height: 33.9, columns: 3, rows: 8, top: 12.9, left: 7.2, gapX: 2.5, gapY: 0 },
];

export const A4 = { width: 210, height: 297 };

export const DEFAULT_SIZE = { stock: "roll", preset: "roll-2x1", width: 50.8, height: 25.4, gap: 3, radius: 1 };

export function withPreset(size, presetId) {
  const roll = ROLL_PRESETS.find(({ id }) => id === presetId);
  if (roll) return { stock: "roll", preset: roll.id, width: roll.width, height: roll.height, gap: roll.gap, radius: size.radius ?? 1 };
  const sheet = SHEET_PRESETS.find(({ id }) => id === presetId);
  if (sheet) {
    const { id, label: _label, ...layout } = sheet;
    return { stock: "sheet", preset: id, radius: size.radius ?? 1, ...layout };
  }
  return { ...size, preset: "custom" };
}

export const perSheet = (size) => (size.stock === "sheet" ? (size.columns || 1) * (size.rows || 1) : 1);

/** Top-left corner (mm on the A4 page) of the n-th label on a sheet. */
export function sheetSlot(size, n) {
  const column = n % (size.columns || 1);
  const row = Math.floor(n / (size.columns || 1));
  return {
    x: (size.left || 0) + column * (size.width + (size.gapX || 0)),
    y: (size.top || 0) + row * (size.height + (size.gapY || 0)),
  };
}

export const describeSize = (size) =>
  `${+Number(size.width).toFixed(2)} × ${+Number(size.height).toFixed(2)} mm${size.stock === "sheet" ? ` · A4 ${perSheet(size)}-up` : " roll"}`;
