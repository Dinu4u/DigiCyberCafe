export {};

(() => {
type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type EnhancerWorkerSettings = {
  brightness: number;
  contrast: number;
  clarity: number;
  exposure: number;
  saturation: number;
  temperature: number;
  denoise: boolean;
};
type EnhancerWorkerRequest = {
  type: "process" | "export";
  bitmap: ImageBitmap;
  settings: EnhancerWorkerSettings;
  autoEnhance: boolean;
  autoDownscale: boolean;
  upscale: boolean;
  format: OutputFormat;
  quality: number;
};
type EnhancerWorkerResponse =
  | { type: "success"; blob: Blob; width: number; height: number; sourceWidth: number; sourceHeight: number }
  | { type: "failure"; kind: "memory" | "artifacts" | "unsupported" | "processing"; message: string };

const MAX_PIXELS = 24_000_000;
const AUTO_DOWNSCALE_EDGE = 3000;
const VIBRANCE = 0.24;

const enhancerWorkerScope = self as unknown as {
  onmessage: ((event: MessageEvent<EnhancerWorkerRequest>) => void) | null;
  postMessage: (message: EnhancerWorkerResponse) => void;
};

enhancerWorkerScope.onmessage = async ({ data }) => {
  const bitmap = data?.bitmap;
  let sourceCanvas: OffscreenCanvas | null = null;
  let outputCanvas: OffscreenCanvas | null = null;
  try {
    if (!bitmap || !isValidRequest(data)) {
      throw new EnhanceWorkerError("processing", "The image enhancement request was incomplete or invalid.");
    }
    if (typeof OffscreenCanvas === "undefined") {
      throw new EnhanceWorkerError("unsupported", "This browser does not support offscreen image processing.");
    }

    const inputPixels = bitmap.width * bitmap.height;
    if (!Number.isSafeInteger(inputPixels) || inputPixels <= 0) {
      throw new EnhanceWorkerError("processing", "The image has invalid dimensions.");
    }
    const exportScale = data.type === "export" && data.upscale ? 2 : 1;
    const maxSourcePixels = MAX_PIXELS / (exportScale * exportScale);
    if (inputPixels > maxSourcePixels && !data.autoDownscale) {
      throw new EnhanceWorkerError("memory", "Image is too large to enhance at full resolution in browser memory.");
    }

    const resizeScale = data.autoDownscale
      ? Math.min(1, AUTO_DOWNSCALE_EDGE / Math.max(bitmap.width, bitmap.height), Math.sqrt(maxSourcePixels / inputPixels))
      : 1;
    const width = Math.max(1, Math.round(bitmap.width * resizeScale));
    const height = Math.max(1, Math.round(bitmap.height * resizeScale));
    sourceCanvas = new OffscreenCanvas(width, height);
    const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new EnhanceWorkerError("memory", "The browser could not allocate an image processing canvas.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    let pixels: ImageData;
    try {
      pixels = context.getImageData(0, 0, width, height);
    } catch {
      throw new EnhanceWorkerError("memory", "Image is too large to enhance at full resolution in browser memory.");
    }
    if (pixels.data.length !== width * height * 4) {
      throw new EnhanceWorkerError("memory", "The browser returned an incomplete image pixel buffer.");
    }

    const clippedRatio = enhancePixels(pixels.data, width, height, data.settings, data.autoEnhance);
    const extremeSettings = data.settings.contrast >= 165 || data.settings.clarity >= 85 || Math.abs(data.settings.exposure) >= 1.8 || data.settings.brightness >= 145 || data.settings.brightness <= 55 || data.settings.saturation >= 145;
    if (extremeSettings && clippedRatio > 0.18) {
      throw new EnhanceWorkerError("artifacts", "Extreme contrast or sharpening applied.");
    }

    context.putImageData(pixels, 0, 0);
    const scale = exportScale;
    const outputWidth = width * scale;
    const outputHeight = height * scale;
    outputCanvas = scale === 1 ? sourceCanvas : new OffscreenCanvas(outputWidth, outputHeight);
    if (scale === 2) {
      const outputContext = outputCanvas.getContext("2d");
      if (!outputContext) throw new EnhanceWorkerError("memory", "The browser could not allocate the 2× export canvas.");
      outputContext.imageSmoothingEnabled = true;
      outputContext.imageSmoothingQuality = "high";
      outputContext.drawImage(sourceCanvas, 0, 0, outputWidth, outputHeight);
    }

    const mime = data.type === "process" ? "image/jpeg" : data.format;
    const quality = data.type === "process" ? 0.86 : data.quality;
    const blob = await outputCanvas.convertToBlob({ type: mime, quality });
    if (!blob.size || (data.type === "export" && blob.type !== data.format)) {
      throw new EnhanceWorkerError("unsupported", `The browser could not encode a non-empty ${data.format} image.`);
    }
    enhancerWorkerScope.postMessage({
      type: "success",
      blob,
      width: outputWidth,
      height: outputHeight,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
    });
  } catch (caught) {
    const error = caught instanceof EnhanceWorkerError
      ? caught
      : /memory|allocation|quota|too large/i.test(caught instanceof Error ? caught.message : "")
        ? new EnhanceWorkerError("memory", "Image is too large to enhance at full resolution in browser memory.")
        : new EnhanceWorkerError("processing", caught instanceof Error ? caught.message : "The image could not be enhanced.");
    enhancerWorkerScope.postMessage({ type: "failure", kind: error.kind, message: error.message });
  } finally {
    bitmap?.close();
    if (outputCanvas && outputCanvas !== sourceCanvas) {
      outputCanvas.width = 0;
      outputCanvas.height = 0;
    }
    if (sourceCanvas) {
      sourceCanvas.width = 0;
      sourceCanvas.height = 0;
    }
  }
};

function isValidRequest(data: EnhancerWorkerRequest): boolean {
  return Boolean(data.settings)
    && ["image/jpeg", "image/png", "image/webp"].includes(data.format)
    && Number.isFinite(data.quality)
    && data.quality > 0
    && data.quality <= 1;
}

function enhancePixels(data: Uint8ClampedArray, width: number, height: number, settings: EnhancerWorkerSettings, autoEnhance: boolean): number {
  const count = width * height;
  let contrastLow = 0;
  let contrastHigh = 255;
  if (autoEnhance) {
    const histogram = new Uint32Array(256);
    for (let pixel = 0; pixel < count; pixel += 1) {
      const offset = pixel * 4;
      const lumaBin = Math.max(0, Math.min(255, Math.round(luminance(data[offset], data[offset + 1], data[offset + 2]))));
      histogram[lumaBin] += 1;
    }
    contrastLow = percentile(histogram, count * 0.02);
    contrastHigh = percentile(histogram, count * 0.98);
    if (contrastHigh <= contrastLow) {
      contrastLow = 0;
      contrastHigh = 255;
    }
  }

  const contrastFactor = settings.contrast / 100;
  const exposureFactor = 2 ** settings.exposure;
  const saturationFactor = settings.saturation / 100;
  const temperatureShift = settings.temperature * 0.55;
  const stretchRange = contrastHigh - contrastLow;
  const toneGamma = autoEnhance ? 0.96 : 1;

  for (let pixel = 0; pixel < count; pixel += 1) {
    const offset = pixel * 4;
    let red = data[offset];
    let green = data[offset + 1];
    let blue = data[offset + 2];

    if (autoEnhance) {
      const originalLuma = luminance(red, green, blue);
      const stretchedLuma = ((originalLuma - contrastLow) * 255) / stretchRange;
      const ratio = originalLuma > 1 ? Math.max(0, stretchedLuma) / originalLuma : 1;
      red *= ratio;
      green *= ratio;
      blue *= ratio;
    }

    red = applyGamma(red, toneGamma);
    green = applyGamma(green, toneGamma);
    blue = applyGamma(blue, toneGamma);
    red = ((red - 127.5) * contrastFactor + 127.5 + (settings.brightness - 100) * 1.35) * exposureFactor + temperatureShift;
    green = ((green - 127.5) * contrastFactor + 127.5 + (settings.brightness - 100) * 1.35) * exposureFactor;
    blue = ((blue - 127.5) * contrastFactor + 127.5 + (settings.brightness - 100) * 1.35) * exposureFactor - temperatureShift;

    const gray = luminance(red, green, blue);
    const saturationBoost = autoEnhance ? VIBRANCE * (1 - saturationOf(red, green, blue)) * (isSkinTone(red, green, blue) ? 0.35 : 1) : 0;
    const colorFactor = saturationFactor + saturationBoost;
    red = gray + (red - gray) * colorFactor;
    green = gray + (green - gray) * colorFactor;
    blue = gray + (blue - gray) * colorFactor;

    const dither = ((pixel * 1103515245 + 12345) & 255) / 255 - 0.5;
    data[offset] = red + dither;
    data[offset + 1] = green + dither;
    data[offset + 2] = blue + dither;
  }

  if (settings.denoise) applyMedianDenoise(data, width, height);
  if (settings.clarity > 0 || autoEnhance) applyUnsharpMask(data, width, height, autoEnhance ? Math.max(0.18, settings.clarity / 100 * 0.65) : settings.clarity / 100 * 0.8);

  let clipped = 0;
  for (let pixel = 0; pixel < count; pixel += 1) {
    const offset = pixel * 4;
    if (Math.max(data[offset], data[offset + 1], data[offset + 2]) >= 254 || Math.min(data[offset], data[offset + 1], data[offset + 2]) <= 1) clipped += 1;
  }
  return clipped / count;
}

function applyUnsharpMask(data: Uint8ClampedArray, width: number, height: number, amount: number) {
  const original = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = (y * width + x) * 4;
      const neighbors = [center - width * 4, center + width * 4, center - 4, center + 4];
      for (let channel = 0; channel < 3; channel += 1) {
        const value = original[center + channel];
        const blur = (value * 4 + original[neighbors[0] + channel] + original[neighbors[1] + channel] + original[neighbors[2] + channel] + original[neighbors[3] + channel]) / 8;
        const highPass = value - blur;
        const thresholded = Math.sign(highPass) * Math.max(0, Math.abs(highPass) - 1.25);
        data[center + channel] = value + thresholded * amount;
      }
    }
  }
}

function applyMedianDenoise(data: Uint8ClampedArray, width: number, height: number) {
  const filtered = new Uint8Array(width * height);
  const values = new Uint8Array(5);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      values[0] = lumaAt(data, y * width + x);
      values[1] = lumaAt(data, Math.max(0, y - 1) * width + x);
      values[2] = lumaAt(data, Math.min(height - 1, y + 1) * width + x);
      values[3] = lumaAt(data, y * width + Math.max(0, x - 1));
      values[4] = lumaAt(data, y * width + Math.min(width - 1, x + 1));
      values.sort();
      filtered[y * width + x] = values[2];
    }
  }
  for (let pixel = 0; pixel < filtered.length; pixel += 1) {
    const offset = pixel * 4;
    const originalLuma = luminance(data[offset], data[offset + 1], data[offset + 2]);
    const difference = filtered[pixel] - originalLuma;
    data[offset] += difference;
    data[offset + 1] += difference;
    data[offset + 2] += difference;
  }
}

function lumaAt(data: Uint8ClampedArray, pixel: number) {
  const offset = pixel * 4;
  return luminance(data[offset], data[offset + 1], data[offset + 2]);
}

function percentile(histogram: Uint32Array, target: number) {
  let total = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    total += histogram[value];
    if (total >= target) return value;
  }
  return 255;
}

function luminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function saturationOf(red: number, green: number, blue: number) {
  const maximum = Math.max(red, green, blue);
  return maximum <= 0 ? 0 : (maximum - Math.min(red, green, blue)) / maximum;
}

function applyGamma(value: number, gamma: number) {
  const normalized = Math.max(0, Math.min(255, value)) / 255;
  return Math.pow(normalized, gamma) * 255;
}

function isSkinTone(red: number, green: number, blue: number) {
  return red > 95 && green > 40 && blue > 20 && red > green && red > blue && Math.abs(red - green) > 15;
}

class EnhanceWorkerError extends Error {
  constructor(readonly kind: "memory" | "artifacts" | "unsupported" | "processing", message: string) {
    super(message);
    this.name = "EnhanceWorkerError";
  }
}
})();