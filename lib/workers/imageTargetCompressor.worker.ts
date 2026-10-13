type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";

type CompressRequest = {
  imageBitmap: ImageBitmap;
  targetSizeKB: number;
  outputFormat: ImageOutputFormat;
};

type WorkerResponse =
  | { type: "success"; imageData: ArrayBuffer; outputFormat: ImageOutputFormat; width: number; height: number; sizeKB: number; quality: number; scale: number }
  | { type: "failure"; kind: "unsupported" | "target-impossible" | "invalid-request" | "render-failure"; message: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<CompressRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

workerScope.onmessage = async ({ data }) => {
  const bitmap = data?.imageBitmap;
  let canvas: OffscreenCanvas | null = null;
  try {
    if (!bitmap || !Number.isFinite(data.targetSizeKB) || data.targetSizeKB <= 0 || !["image/png", "image/jpeg", "image/webp"].includes(data.outputFormat)) {
      throw new CompressionError("invalid-request", "The compression settings were incomplete or invalid.");
    }
    if (typeof OffscreenCanvas === "undefined") {
      throw new CompressionError("unsupported", "Background image processing is not supported in this browser.");
    }

    const targetBytes = data.targetSizeKB * 1024;
    let width = bitmap.width;
    let height = bitmap.height;
    canvas = new OffscreenCanvas(width, height);
    let context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not create an offscreen canvas context.");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    let scale = 1;
    let minimumBlob = await encodeCanvas(canvas, data.outputFormat, 0.01);
    for (let resizeAttempt = 0; minimumBlob.size > targetBytes && resizeAttempt < 4; resizeAttempt += 1) {
      const scaleFactor = Math.sqrt(targetBytes / minimumBlob.size) * 0.95;
      const nextWidth = Math.max(1, Math.floor(width * scaleFactor));
      const nextHeight = Math.max(1, Math.floor(height * scaleFactor));
      if (nextWidth < 100 || nextHeight < 100 || nextWidth * nextHeight < 40_000) {
        throw new CompressionError("target-impossible", `Cannot compress below ${data.targetSizeKB} KB without unreadable distortion.`);
      }
      const nextCanvas = new OffscreenCanvas(nextWidth, nextHeight);
      const nextContext = nextCanvas.getContext("2d", { alpha: false });
      if (!nextContext) throw new Error("Could not resize the offscreen canvas.");
      nextContext.fillStyle = "#FFFFFF";
      nextContext.fillRect(0, 0, nextWidth, nextHeight);
      nextContext.drawImage(bitmap, 0, 0, nextWidth, nextHeight);
      canvas.width = 0;
      canvas.height = 0;
      canvas = nextCanvas;
      context = nextContext;
      width = nextWidth;
      height = nextHeight;
      scale *= scaleFactor;
      minimumBlob = await encodeCanvas(canvas, data.outputFormat, 0.01);
    }

    if (minimumBlob.size > targetBytes) {
      throw new CompressionError("target-impossible", `Cannot compress below ${data.targetSizeKB} KB without unreadable distortion.`);
    }

    let bestBlob = minimumBlob;
    let bestQuality = 0.01;
    let low = 0.01;
    let high = 0.99;
    for (let iteration = 0; iteration < 7; iteration += 1) {
      const quality = (low + high) / 2;
      const blob = await encodeCanvas(canvas, data.outputFormat, quality);
      if (blob.size <= targetBytes) {
        bestBlob = blob;
        bestQuality = quality;
        low = quality;
      } else {
        high = quality;
      }
      if (Math.abs(blob.size - targetBytes) <= targetBytes * 0.05) {
        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQuality = quality;
        }
        break;
      }
    }

    const imageData = await bestBlob.arrayBuffer();
    workerScope.postMessage({
      type: "success",
      imageData,
      outputFormat: data.outputFormat,
      width,
      height,
      sizeKB: bestBlob.size / 1024,
      quality: bestQuality,
      scale,
    }, [imageData]);
  } catch (error) {
    const kind = error instanceof CompressionError ? error.kind : "render-failure";
    workerScope.postMessage({ type: "failure", kind, message: error instanceof Error ? error.message : "Image compression failed in the background worker." });
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
};

async function encodeCanvas(canvas: OffscreenCanvas, outputFormat: ImageOutputFormat, quality: number) {
  const blob = await canvas.convertToBlob({ type: outputFormat, quality });
  if (blob.type !== outputFormat) throw new CompressionError("unsupported", `This browser cannot encode ${outputFormat}. Choose a supported output format or try another browser.`);
  return blob;
}

class CompressionError extends Error {
  constructor(readonly kind: "unsupported" | "target-impossible" | "invalid-request", message: string) {
    super(message);
    this.name = "CompressionError";
  }
}
