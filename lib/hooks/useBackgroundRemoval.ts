"use client";

import { useEffect, useRef, useState } from "react";

export type BackgroundMode = "transparent" | "white" | "blue" | "gray" | "custom" | "image";
export type RemovalStatus = "idle" | "downloading-model" | "processing" | "ready" | "error";
export type RemovalError = {
  scenario: "memory" | "acceleration" | "no-subject" | "corrupt" | "unknown";
  title: string;
  message: string;
  steps: string[];
};
export type RemovalProgress = { status: "downloading-model" | "processing"; progress: number; message: string };

type WorkerMessage =
  | { type: "progress"; status: "downloading-model" | "processing"; progress: number; message: string }
  | { type: "success"; previewPng: Blob; maskData: ArrayBuffer; maskWidth: number; maskHeight: number; sourceWidth: number; sourceHeight: number; inferenceScale: number }
  | { type: "failure"; kind: RemovalError["scenario"]; message: string };

type MaskResult = Omit<Extract<WorkerMessage, { type: "success" }>, "previewPng" | "type">;
export type ExportOptions = { format: "image/png" | "image/jpeg"; targetSizeKB: number | null; backgroundMode: BackgroundMode; customColor: string; backdrop: File | null };

const MAX_EXPORT_EDGE = 4000;
const MAX_EXPORT_PIXELS = 16_000_000;

export function useBackgroundRemoval(source: File | null, backgroundMode: BackgroundMode, customColor: string, backdrop: File | null, runId = 0) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [maskResult, setMaskResult] = useState<MaskResult | null>(null);
  const [status, setStatus] = useState<RemovalStatus>("idle");
  const [progress, setProgress] = useState<RemovalProgress | null>(null);
  const [error, setError] = useState<RemovalError | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputDimensions, setOutputDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!source) {
      const frame = window.requestAnimationFrame(() => {
        setMaskResult(null);
        setProgress(null);
        setError(null);
        setOutputBlob(null);
        setStatus("idle");
        setOutputDimensions({ width: 0, height: 0 });
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let active = true;
    const startFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      setMaskResult(null);
      setOutputBlob(null);
      setError(null);
      setStatus("downloading-model");
      setProgress({ status: "downloading-model", progress: 0, message: "Preparing the local segmentation model…" });
      void source.arrayBuffer().then((imageBytes) => {
        if (!active) return;
        const worker = new Worker(new URL("../workers/bgRemoval.worker.ts", import.meta.url), { type: "module" });
        workerRef.current = worker;
        worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
          if (!active) return;
          if (data.type === "progress") {
            setStatus(data.status);
            setProgress(data);
            return;
          }
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setProgress(null);
          if (data.type === "failure") {
            setError(recoveryFor(data.kind, data.message));
            setStatus("error");
            return;
          }
            setMaskResult({
              maskData: data.maskData,
              maskWidth: data.maskWidth,
              maskHeight: data.maskHeight,
              sourceWidth: data.sourceWidth,
              sourceHeight: data.sourceHeight,
              inferenceScale: data.inferenceScale,
            });
          setOutputDimensions(getSafeDimensions(data.sourceWidth, data.sourceHeight));
          setStatus("processing");
        };
        worker.onerror = (event) => {
          if (!active) return;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setProgress(null);
          setError(recoveryFor("acceleration", event.message || "The background removal worker stopped unexpectedly."));
          setStatus("error");
        };
        try {
          worker.postMessage({ type: "remove-background", imageBytes, mimeType: source.type }, [imageBytes]);
        } catch (caught) {
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setProgress(null);
          setError(recoveryFor("memory", caught instanceof Error ? caught.message : "Could not transfer image data to the worker."));
          setStatus("error");
        }
      }).catch((caught: unknown) => {
        if (!active) return;
        setProgress(null);
        setError(recoveryFor("corrupt", caught instanceof Error ? caught.message : "Could not read the selected image."));
        setStatus("error");
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(startFrame);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [source, runId]);

  useEffect(() => {
    if (!source || !maskResult || !canvasRef.current) return;
    let active = true;
    let sourceBitmap: ImageBitmap | null = null;
    let backdropBitmap: ImageBitmap | null = null;
    let foregroundCanvas: HTMLCanvasElement | null = null;
    let maskCanvas: HTMLCanvasElement | null = null;

    void (async () => {
      try {
        const target = getSafeDimensions(maskResult.sourceWidth, maskResult.sourceHeight);
        const resizeOptions: ImageBitmapOptions = { resizeWidth: target.width, resizeHeight: target.height, resizeQuality: "high" };
        sourceBitmap = await createImageBitmap(source, resizeOptions);
        foregroundCanvas = document.createElement("canvas");
        foregroundCanvas.width = target.width;
        foregroundCanvas.height = target.height;
        const foregroundContext = foregroundCanvas.getContext("2d", { alpha: true });
        if (!foregroundContext) throw new Error("The browser could not allocate a canvas for the foreground subject.");
        foregroundContext.drawImage(sourceBitmap, 0, 0, target.width, target.height);

        maskCanvas = document.createElement("canvas");
        maskCanvas.width = maskResult.maskWidth;
        maskCanvas.height = maskResult.maskHeight;
        const maskContext = maskCanvas.getContext("2d", { alpha: false });
        if (!maskContext) throw new Error("The browser could not allocate a canvas for the subject mask.");
        const alpha = new Uint8Array(maskResult.maskData);
        const maskPixels = new Uint8ClampedArray(alpha.length * 4);
        for (let pixel = 0; pixel < alpha.length; pixel += 1) {
          const index = pixel * 4;
          maskPixels[index] = 255;
          maskPixels[index + 1] = 255;
          maskPixels[index + 2] = 255;
          maskPixels[index + 3] = alpha[pixel];
        }
        maskContext.putImageData(new ImageData(maskPixels, maskCanvas.width, maskCanvas.height), 0, 0);
        foregroundContext.globalCompositeOperation = "destination-in";
        foregroundContext.drawImage(maskCanvas, 0, 0, target.width, target.height);
        foregroundContext.globalCompositeOperation = "source-over";

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = target.width;
        canvas.height = target.height;
        const context = canvas.getContext("2d", { alpha: backgroundMode === "transparent" });
        if (!context) throw new Error("The browser could not allocate the result canvas.");
        context.clearRect(0, 0, target.width, target.height);
        if (backgroundMode === "white") {
          context.fillStyle = "#FFFFFF";
          context.fillRect(0, 0, target.width, target.height);
        } else if (backgroundMode === "blue") {
          context.fillStyle = "#3B82F6";
          context.fillRect(0, 0, target.width, target.height);
        } else if (backgroundMode === "gray") {
          context.fillStyle = "#E5E7EB";
          context.fillRect(0, 0, target.width, target.height);
        } else if (backgroundMode === "custom") {
          context.fillStyle = customColor;
          context.fillRect(0, 0, target.width, target.height);
        } else if (backgroundMode === "image" && backdrop) {
          backdropBitmap = await createImageBitmap(backdrop);
          drawCover(context, backdropBitmap, target.width, target.height);
        }
        context.drawImage(foregroundCanvas, 0, 0);

        const blob = await canvasToBlob(canvas, "image/png");
        if (!active) return;
        setOutputBlob(blob);
        setStatus("ready");
        setProgress(null);
      } catch (caught) {
        if (!active) return;
        const memoryError = caught instanceof Error && /memory|allocation|quota/i.test(caught.message);
        setError(recoveryFor(memoryError ? "memory" : "unknown", caught instanceof Error ? caught.message : "Could not composite the removed background."));
        setStatus("error");
        setProgress(null);
      } finally {
        sourceBitmap?.close();
        backdropBitmap?.close();
        if (foregroundCanvas) { foregroundCanvas.width = 0; foregroundCanvas.height = 0; }
        if (maskCanvas) { maskCanvas.width = 0; maskCanvas.height = 0; }
      }
    })();

    return () => { active = false; };
  }, [source, maskResult, backgroundMode, customColor, backdrop]);

  async function exportImage(options: ExportOptions) {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") throw new Error("The processed image is not ready to export.");
    const exportCanvas = document.createElement("canvas");
    const sourceCanvas = canvas;
    let width = sourceCanvas.width;
    let height = sourceCanvas.height;
    exportCanvas.width = width;
    exportCanvas.height = height;
    const context = exportCanvas.getContext("2d", { alpha: options.format === "image/png" && options.backgroundMode === "transparent" });
    if (!context) throw new Error("Could not create an export canvas.");
    if (options.format === "image/jpeg") {
      context.fillStyle = options.backgroundMode === "custom" ? options.customColor : options.backgroundMode === "blue" ? "#3B82F6" : options.backgroundMode === "gray" ? "#E5E7EB" : "#FFFFFF";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(sourceCanvas, 0, 0);

    try {
      let blob = await canvasToBlob(exportCanvas, options.format, 0.94);
      if (options.targetSizeKB !== null) {
        const targetBytes = options.targetSizeKB * 1024;
        for (let attempt = 0; blob.size > targetBytes && attempt < 5; attempt += 1) {
          if (options.format === "image/jpeg") {
            const lowBlob = await canvasToBlob(exportCanvas, options.format, 0.08);
            if (lowBlob.size <= targetBytes) {
              let low = 0.08;
              let high = 0.94;
              let best = lowBlob;
              for (let iteration = 0; iteration < 7; iteration += 1) {
                const quality = (low + high) / 2;
                const candidate = await canvasToBlob(exportCanvas, options.format, quality);
                if (candidate.size <= targetBytes) { best = candidate; low = quality; }
                else high = quality;
                if (Math.abs(candidate.size - targetBytes) <= targetBytes * 0.05 && candidate.size <= targetBytes) { best = candidate; break; }
              }
              blob = best;
              break;
            }
          }
          const scale = Math.sqrt(targetBytes / blob.size) * 0.92;
          const nextWidth = Math.max(128, Math.floor(width * scale));
          const nextHeight = Math.max(128, Math.floor(height * scale));
          if (nextWidth === width && nextHeight === height) break;
          const resized = document.createElement("canvas");
          resized.width = nextWidth;
          resized.height = nextHeight;
          const resizedContext = resized.getContext("2d", { alpha: options.format === "image/png" && options.backgroundMode === "transparent" });
          if (!resizedContext) throw new Error("Could not allocate a smaller export canvas.");
          if (options.format === "image/jpeg") {
            resizedContext.fillStyle = options.backgroundMode === "custom" ? options.customColor : options.backgroundMode === "blue" ? "#3B82F6" : options.backgroundMode === "gray" ? "#E5E7EB" : "#FFFFFF";
            resizedContext.fillRect(0, 0, nextWidth, nextHeight);
          }
          resizedContext.drawImage(exportCanvas, 0, 0, width, height, 0, 0, nextWidth, nextHeight);
          exportCanvas.width = 0;
          exportCanvas.height = 0;
          exportCanvas.width = nextWidth;
          exportCanvas.height = nextHeight;
          const nextContext = exportCanvas.getContext("2d", { alpha: options.format === "image/png" && options.backgroundMode === "transparent" });
          if (!nextContext) throw new Error("Could not allocate a resized export canvas.");
          nextContext.drawImage(resized, 0, 0);
          resized.width = 0;
          resized.height = 0;
          width = nextWidth;
          height = nextHeight;
          blob = await canvasToBlob(exportCanvas, options.format, 0.82);
        }
        if (blob.size > targetBytes) throw new Error(`Cannot reduce this result below ${options.targetSizeKB} KB without excessive quality loss.`);
      }
      return { blob, width, height };
    } finally {
      exportCanvas.width = 0;
      exportCanvas.height = 0;
    }
  }

  function reset() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setMaskResult(null);
    setProgress(null);
    setError(null);
    setOutputBlob(null);
    setStatus("idle");
  }

  return { canvasRef, status, progress, error, outputBlob, outputDimensions, reset, exportImage };
}

function getSafeDimensions(width: number, height: number) {
  const longest = Math.max(width, height);
  const byEdge = MAX_EXPORT_EDGE / longest;
  const byPixels = Math.sqrt(MAX_EXPORT_PIXELS / Math.max(1, width * height));
  const scale = Math.min(1, byEdge, byPixels);
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}

function drawCover(context: CanvasRenderingContext2D, image: ImageBitmap, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  context.drawImage(image, (image.width - cropWidth) / 2, (image.height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode this image.")), type, quality);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Canvas export failed."));
    }
  });
}

function recoveryFor(kind: RemovalError["scenario"], detail: string): RemovalError {
  if (kind === "memory") return { scenario: kind, title: "Browser / Device Memory Exhausted", message: "Out of browser memory while processing image.", steps: ["The uploaded image resolution is too high for your browser's current memory. Please resize your image below 2000px, or close other heavy browser tabs and try again.", "After reducing the size, upload the image again."] };
  if (kind === "acceleration") return { scenario: kind, title: "WebAssembly / WebGPU Acceleration Blocked", message: "Hardware acceleration / AI engine could not initialize.", steps: ["Check if your browser supports WebAssembly or disable strict adblockers that may be blocking local worker assets. Trying Chrome or Edge usually resolves this.", "Allow the first-run model files to finish downloading, then retry."] };
  if (kind === "no-subject") return { scenario: kind, title: "No Clear Foreground Detected", message: "Could not separate foreground subject from background.", steps: ["Ensure the photo has clear contrast between the subject and the surroundings. Avoid heavily blurred or underexposed photos.", "Try a different image with one clearly visible foreground subject."] };
  if (kind === "corrupt") return { scenario: kind, title: "Corrupted or Unsupported File", message: "Invalid or corrupted image format.", steps: ["Please upload a valid JPG, PNG, or WebP file.", "If taking photos on iPhone, convert HEIC to JPG before uploading.", "If the file still fails, export it again from an image editor."] };
  return { scenario: kind, title: "Could not finish background removal", message: detail || "The browser could not complete the image operation.", steps: ["Try a smaller image, preferably below 2000px on its longest edge.", "Check that the browser has enough memory and WebAssembly support.", "Clear the current image and try again."] };
}
