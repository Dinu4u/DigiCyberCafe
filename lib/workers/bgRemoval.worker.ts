import { AutoModel, AutoProcessor, RawImage, type ProgressInfo } from "@huggingface/transformers";

type WorkerRequest = { type: "remove-background"; imageBytes: ArrayBuffer; mimeType: string };
type WorkerProgress = { type: "progress"; status: "downloading-model" | "processing"; progress: number; message: string };
type WorkerResult =
  | { type: "success"; maskData: ArrayBuffer; maskWidth: number; maskHeight: number; sourceWidth: number; sourceHeight: number; inferenceScale: number }
  | { type: "failure"; kind: "memory" | "acceleration" | "no-subject" | "corrupt" | "unknown"; message: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerProgress | WorkerResult, transfer?: Transferable[]) => void;
};

const MODEL_ID = "onnx-community/BiRefNet_lite-ONNX";
const MODEL_REVISION = "de15b22ba131738a16dff04aab8bdf8dc32e3ac1";
const MAX_INFERENCE_EDGE = 2500;
let busy = false;

type BiRefNetModel = Awaited<ReturnType<typeof AutoModel.from_pretrained>>;
type BiRefNetProcessor = Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>;

workerScope.onmessage = async ({ data }) => {
  if (busy) {
    workerScope.postMessage({ type: "failure", kind: "unknown", message: "The image worker is already processing another photo." });
    return;
  }
  busy = true;
  let bitmap: ImageBitmap | null = null;
  let inputCanvas: OffscreenCanvas | null = null;
  let model: BiRefNetModel | null = null;

  const progress = (status: WorkerProgress["status"], value: number, message: string) => {
    workerScope.postMessage({ type: "progress", status, progress: Math.max(0, Math.min(100, Math.round(value))), message });
  };

  try {
    if (!(data?.imageBytes instanceof ArrayBuffer) || !data.mimeType.startsWith("image/")) {
      throw new BackgroundWorkerError("corrupt", "The image data could not be read. Re-upload a valid JPG, PNG, or WebP image.");
    }
    if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") {
      throw new BackgroundWorkerError("acceleration", "OffscreenCanvas or ImageBitmap is unavailable in this browser worker.");
    }

    const sourceBlob = new Blob([data.imageBytes], { type: data.mimeType });
    bitmap = await createImageBitmap(sourceBlob);
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (sourceWidth < 2 || sourceHeight < 2) throw new BackgroundWorkerError("corrupt", "The image has no usable dimensions.");
    if (sourceWidth * sourceHeight > 60_000_000) throw new BackgroundWorkerError("memory", "This image has more than 60 megapixels and may exceed available browser memory.");

    const inferenceScale = Math.min(1, MAX_INFERENCE_EDGE / Math.max(sourceWidth, sourceHeight));
    const inferenceWidth = Math.max(1, Math.round(sourceWidth * inferenceScale));
    const inferenceHeight = Math.max(1, Math.round(sourceHeight * inferenceScale));
    inputCanvas = new OffscreenCanvas(inferenceWidth, inferenceHeight);
    const inputContext = inputCanvas.getContext("2d", { alpha: false });
    if (!inputContext) throw new BackgroundWorkerError("acceleration", "The browser could not allocate an OffscreenCanvas.");
    inputContext.fillStyle = "#FFFFFF";
    inputContext.fillRect(0, 0, inferenceWidth, inferenceHeight);
    inputContext.drawImage(bitmap, 0, 0, inferenceWidth, inferenceHeight);
    bitmap.close();
    bitmap = null;

    progress("downloading-model", 0, "Preparing the higher-quality BiRefNet Lite model…");
    const canTryWebGpu = Boolean((self.navigator as unknown as { gpu?: unknown }).gpu);
    let device: "webgpu" | "wasm" = canTryWebGpu ? "webgpu" : "wasm";
    let processor: BiRefNetProcessor;
    try {
      ({ model, processor } = await loadBiRefNet(device, progress));
    } catch (error) {
      if (device !== "webgpu") throw error;
      device = "wasm";
      progress("downloading-model", 0, "GPU initialization failed. Preparing the browser WASM engine…");
      ({ model, processor } = await loadBiRefNet(device, progress));
    }
    progress("processing", 5, `Separating foreground with ${device === "webgpu" ? "GPU" : "WASM"} acceleration…`);

    let maskData: Uint8Array;
    try {
      maskData = await inferMask(model, processor, inputCanvas, inferenceWidth, inferenceHeight);
    } catch (error) {
      if (device !== "webgpu") throw error;
      await safelyDispose(model);
      model = null;
      device = "wasm";
      progress("processing", 8, "GPU acceleration was unavailable. Retrying with browser WASM…");
      ({ model, processor } = await loadBiRefNet(device, progress));
      maskData = await inferMask(model, processor, inputCanvas, inferenceWidth, inferenceHeight);
    }

    validateMask(maskData);
    const transferredMask = maskData.buffer as ArrayBuffer;
    progress("processing", 100, "Foreground mask ready.");
    workerScope.postMessage({
      type: "success",
      maskData: transferredMask,
      maskWidth: inferenceWidth,
      maskHeight: inferenceHeight,
      sourceWidth,
      sourceHeight,
      inferenceScale,
    }, [transferredMask]);
  } catch (error) {
    const kind = error instanceof BackgroundWorkerError ? error.kind : classifyError(error);
    workerScope.postMessage({ type: "failure", kind, message: error instanceof Error ? error.message : "Background removal failed unexpectedly." });
  } finally {
    bitmap?.close();
    if (inputCanvas) {
      inputCanvas.width = 0;
      inputCanvas.height = 0;
    }
    await safelyDispose(model);
    busy = false;
  }
};

async function loadBiRefNet(
  device: "webgpu" | "wasm",
  progress: (status: WorkerProgress["status"], value: number, message: string) => void,
) {
  const progressCallback = (info: ProgressInfo) => {
    if (info.status === "progress_total") {
      progress("downloading-model", info.progress, "Downloading BiRefNet Lite model files to this browser…");
    } else if (info.status === "ready") {
      progress("downloading-model", 100, "BiRefNet Lite model ready.");
    }
  };
  const [model, processor] = await Promise.all([
    AutoModel.from_pretrained(MODEL_ID, {
      revision: MODEL_REVISION,
      device,
      dtype: device === "webgpu" ? "fp16" : "fp32",
      progress_callback: progressCallback,
    }),
    AutoProcessor.from_pretrained(MODEL_ID, {
      revision: MODEL_REVISION,
      progress_callback: progressCallback,
    }),
  ]);
  return { model, processor };
}

async function inferMask(
  model: BiRefNetModel,
  processor: BiRefNetProcessor,
  canvas: OffscreenCanvas,
  width: number,
  height: number,
) {
  const { pixel_values } = await processor(RawImage.fromCanvas(canvas));
  const { output_image } = await model({ input_image: pixel_values });
  const predictedMask = output_image[0].sigmoid().mul(255).to("uint8");
  const resizedMask = await RawImage.fromTensor(predictedMask).resize(width, height);
  if (resizedMask.channels !== 1 || resizedMask.data.length !== width * height) {
    throw new BackgroundWorkerError("unknown", "BiRefNet returned an unsupported mask shape.");
  }
  return Uint8Array.from(resizedMask.data);
}

function validateMask(mask: Uint8Array) {
  let min = 255;
  let max = 0;
  let foregroundPixels = 0;
  for (const alpha of mask) {
    min = Math.min(min, alpha);
    max = Math.max(max, alpha);
    if (alpha >= 32) foregroundPixels += 1;
  }
  const ratio = foregroundPixels / Math.max(1, mask.length);
  if (max - min < 12 || ratio < 0.002 || ratio > 0.998) {
    throw new BackgroundWorkerError("no-subject", "The model could not find a clear foreground subject in this image.");
  }
}

async function safelyDispose(model: BiRefNetModel | null) {
  if (!model) return;
  try {
    await model.dispose();
  } catch {
    // Model disposal is best-effort; the worker is terminated after each job.
  }
}

function classifyError(error: unknown): BackgroundWorkerError["kind"] {
  const message = error instanceof Error ? error.message : String(error);
  if (/out of memory|memory allocation|allocation failed|heap|wasm memory|failed to allocate/i.test(message)) return "memory";
  if (/fetch|network|wasm|webgpu|onnx|asset|cross-origin|failed to load/i.test(message)) return "acceleration";
  if (/image|decode|corrupt|format|unsupported/i.test(message)) return "corrupt";
  return "unknown";
}

class BackgroundWorkerError extends Error {
  constructor(readonly kind: "memory" | "acceleration" | "no-subject" | "corrupt" | "unknown", message: string) {
    super(message);
    this.name = "BackgroundWorkerError";
  }
}
