export const LOGO_SRC = "/new-logo.png";
export const LOGO_ASPECT = 1092 / 181;
export const LOGO_FILTER = "grayscale(1) contrast(3)";

const MAX_SIDE = 900;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = src;
  });
}

function drawScaled(image, maxSide = MAX_SIDE) {
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * An uploaded picture for the label: turned into pure black on transparent (what a
 * thermal head prints), or kept as a light photo for a non-printing guide layer.
 */
export async function readImageFile(file, { guide = false, threshold = 150 } = {}) {
  const image = await loadImage(await readAsDataUrl(file));
  const { canvas, context } = drawScaled(image, guide ? 1200 : MAX_SIDE);
  const aspect = canvas.width / canvas.height;
  if (guide) return { src: canvas.toDataURL("image/jpeg", 0.7), aspect };

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const luma = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) * alpha + 255 * (1 - alpha);
    const ink = luma < threshold;
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = ink ? 255 : 0;
  }
  context.putImageData(pixels, 0, 0);
  return { src: canvas.toDataURL("image/png"), aspect };
}

const baked = new Map();

/** The shop logo with its print filter applied in pixels, for the dot-accurate preview. */
export function bakedLogo() {
  if (!baked.has(LOGO_SRC)) {
    baked.set(
      LOGO_SRC,
      loadImage(LOGO_SRC).then((image) => {
        const { canvas, context } = drawScaled(image, 2400);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = pixels;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          const value = Math.max(0, Math.min(1, (gray - 0.5) * 3 + 0.5)) * 255;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        context.putImageData(pixels, 0, 0);
        return canvas.toDataURL("image/png");
      })
    );
  }
  return baked.get(LOGO_SRC);
}
