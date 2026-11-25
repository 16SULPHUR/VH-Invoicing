import { Barcode, Circle, Image, Minus, QrCode, Square, Type } from "lucide-react";

export const PX_PER_MM = 96 / 25.4;
export const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 5, 6, 8];

export const TYPE_ICONS = { text: Type, qr: QrCode, barcode: Barcode, image: Image, line: Minus, box: Square, ellipse: Circle };

/** A clear tag stuck on printed cloth, so the design can be judged the way it is seen. */
export const CLEAR_TAG_BACKGROUND = {
  background:
    "linear-gradient(115deg, rgb(255 255 255 / .55) 0 18%, transparent 30% 62%, rgb(255 255 255 / .35) 75%, transparent 90%)," +
    "radial-gradient(circle at 8px 8px, hsl(333 72% 49% / .22) 2.4px, transparent 3px) 0 0 / 16px 16px," +
    "radial-gradient(circle at 0 0, transparent 5px, hsl(37 92% 45% / .28) 5.5px 6.5px, transparent 7px) 8px 8px / 16px 16px," +
    "#efe3cb",
};
