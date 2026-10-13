import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type WorkerRequest = {
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: string;
  targetSizeKB: number;
};
type ProgressMessage = {
  type: "progress";
  phase: "reading" | "rendering" | "compressing" | "assembling";
  pagesDone: number;
  pagesTotal: number;
};
type WorkerResponse =
  | ProgressMessage
  | { type: "success"; resultData: ArrayBuffer; mimeType: "image/jpeg" | "application/pdf"; finalSizeKB: number; quality: number; width?: number; height?: number; pages?: number }
  | { type: "failure"; message: string; kind: "invalid" | "unsupported" | "unreachable" | "processing" };
type PdfPageRecord = { page: pdfjs.PDFPageProxy; width: number; height: number };

const MAX_IMAGE_PIXELS = 24_000_000;
const MAX_RENDER_EDGE = 3000;
const MIN_IMAGE_EDGE = 80;
const MIN_PDF_SCALE = 0.12;
const MAX_RESIZE_ATTEMPTS = 8;
const QUALITY_ITERATIONS = 7;

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

workerScope.onmessage = async ({ data }) => {
  try {
    validateRequest(data);
    postProgress("reading");
    const result = data.mimeType === "application/pdf" || data.fileName.toLowerCase().endsWith(".pdf")
      ? await compressPdf(data)
      : await compressImage(data);
    const resultData = Uint8Array.from(result.bytes).buffer;
    workerScope.postMessage({
      type: "success",
      resultData,
      mimeType: result.mimeType,
      finalSizeKB: resultData.byteLength / 1024,
      quality: result.quality,
      width: "width" in result ? result.width : undefined,
      height: "height" in result ? result.height : undefined,
      pages: "pages" in result ? result.pages : undefined,
    }, [resultData]);
  } catch (caught) {
    const error = caught instanceof CompressionWorkerError
      ? caught
      : new CompressionWorkerError("processing", caught instanceof Error ? caught.message : "The file could not be compressed.");
    workerScope.postMessage({ type: "failure", kind: error.kind, message: error.message });
  }
};

function validateRequest(data: WorkerRequest) {
  if (!(data?.fileData instanceof ArrayBuffer) || data.fileData.byteLength === 0) {
    throw new CompressionWorkerError("invalid", "Choose a non-empty image or PDF file.");
  }
  if (!Number.isFinite(data.targetSizeKB) || data.targetSizeKB < 1) {
    throw new CompressionWorkerError("invalid", "Enter a target size of at least 1 KB.");
  }
  const isPdf = data.mimeType === "application/pdf" || data.fileName.toLowerCase().endsWith(".pdf");
  const validImage = ["image/jpeg", "image/png", "image/webp"].includes(data.mimeType) || /\.(jpe?g|png|webp)$/i.test(data.fileName);
  if (!isPdf && !validImage) {
    throw new CompressionWorkerError("unsupported", "This file type is not supported. Choose JPEG, PNG, WebP, or PDF.");
  }
}

async function compressImage(data: WorkerRequest) {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") {
    throw new CompressionWorkerError("unsupported", "This browser does not support local image compression.");
  }
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;
  try {
    bitmap = await createImageBitmap(new Blob([data.fileData], { type: data.mimeType }));
    if (!bitmap.width || !bitmap.height) throw new CompressionWorkerError("invalid", "The image could not be decoded.");
    const targetBytes = data.targetSizeKB * 1024;
    const initialScale = Math.min(1, Math.sqrt(MAX_IMAGE_PIXELS / (bitmap.width * bitmap.height)), MAX_RENDER_EDGE / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.floor(bitmap.width * initialScale));
    let height = Math.max(1, Math.floor(bitmap.height * initialScale));
    let minimumBlob: Blob | null = null;

    for (let attempt = 0; attempt < MAX_RESIZE_ATTEMPTS; attempt += 1) {
      canvas = drawBitmapOnWhite(bitmap, width, height);
      minimumBlob = await encodeImage(canvas, 0.01);
      if (minimumBlob.size <= targetBytes) break;
      const scaleFactor = Math.sqrt(targetBytes / minimumBlob.size) * 0.95;
      const nextWidth = Math.floor(width * scaleFactor);
      const nextHeight = Math.floor(height * scaleFactor);
      if (nextWidth < MIN_IMAGE_EDGE || nextHeight < MIN_IMAGE_EDGE || (nextWidth === width && nextHeight === height)) break;
      canvas.width = 0;
      canvas.height = 0;
      canvas = null;
      width = nextWidth;
      height = nextHeight;
    }

    if (!canvas || !minimumBlob || minimumBlob.size > targetBytes) {
      throw new CompressionWorkerError("unreachable", `This image cannot be reduced to ${data.targetSizeKB} KB without severe quality loss.`);
    }

    let bestBlob = minimumBlob;
    let bestQuality = 0.01;
    let low = 0.01;
    let high = 1;
    for (let iteration = 0; iteration < QUALITY_ITERATIONS; iteration += 1) {
      const quality = (low + high) / 2;
      const candidate = await encodeImage(canvas, quality);
      if (candidate.size <= targetBytes) {
        bestBlob = candidate;
        bestQuality = quality;
        low = quality;
      } else {
        high = quality;
      }
      if (candidate.size <= targetBytes && candidate.size >= targetBytes * 0.95) break;
    }

    return {
      bytes: new Uint8Array(await bestBlob.arrayBuffer()),
      mimeType: "image/jpeg" as const,
      quality: bestQuality,
      width,
      height,
    };
  } catch (caught) {
    if (caught instanceof CompressionWorkerError) throw caught;
    if (/memory|allocation|quota|too large/i.test(caught instanceof Error ? caught.message : "")) {
      throw new CompressionWorkerError("unreachable", "The image is too large for available browser memory. Try a smaller image.");
    }
    throw new CompressionWorkerError("processing", caught instanceof Error ? caught.message : "The image could not be compressed.");
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function drawBitmapOnWhite(bitmap: ImageBitmap, width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new CompressionWorkerError("processing", "The browser could not allocate the image canvas.");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

async function encodeImage(canvas: OffscreenCanvas, quality: number) {
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  if (!blob.size || blob.type !== "image/jpeg") {
    throw new CompressionWorkerError("unsupported", "The browser could not encode a JPEG image.");
  }
  return blob;
}

async function compressPdf(data: WorkerRequest) {
  let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null;
  let pdfWorkerPort: Worker | null = null;
  const pageRecords: PdfPageRecord[] = [];
  let workingCanvases: OffscreenCanvas[] = [];
  try {
    pdfWorkerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url), { type: "module" });
    pdfjs.GlobalWorkerOptions.workerPort = pdfWorkerPort;
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(data.fileData), useWorkerFetch: false });
    const source = await loadingTask.promise;
    if (!source.numPages) throw new CompressionWorkerError("invalid", "The PDF does not contain any pages.");
    if (source.numPages > 120) throw new CompressionWorkerError("unreachable", "This PDF has too many pages to compress safely in browser memory.");

    let totalArea = 0;
    let maxEdge = 0;
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      pageRecords.push({ page, width: viewport.width, height: viewport.height });
      totalArea += viewport.width * viewport.height;
      maxEdge = Math.max(maxEdge, viewport.width, viewport.height);
    }
    const startScale = Math.min(1.5, MAX_RENDER_EDGE / maxEdge, Math.sqrt(MAX_IMAGE_PIXELS / totalArea));
    let scale = startScale;
    let bestPdf: Uint8Array | null = null;
    let bestQuality = 0.01;

    for (let attempt = 0; attempt < MAX_RESIZE_ATTEMPTS; attempt += 1) {
      workingCanvases = await renderPages(pageRecords, scale);
      const minimumPdf = await encodePdf(workingCanvases, pageRecords, 0.01, "compressing");
      postProgress("compressing", source.numPages, source.numPages);
      if (minimumPdf.byteLength <= data.targetSizeKB * 1024) {
        bestPdf = minimumPdf;
        break;
      }

      const scaleFactor = Math.sqrt((data.targetSizeKB * 1024) / minimumPdf.byteLength) * 0.95;
      const nextScale = scale * scaleFactor;
      if (nextScale < MIN_PDF_SCALE || nextScale >= scale) break;
      clearCanvases(workingCanvases);
      workingCanvases = [];
      scale = nextScale;
    }

    if (!bestPdf) {
      throw new CompressionWorkerError("unreachable", `This PDF could not be reduced to ${data.targetSizeKB} KB. Try a larger target size.`);
    }

    let low = 0.01;
    let high = 1;
    for (let iteration = 0; iteration < QUALITY_ITERATIONS; iteration += 1) {
      const quality = (low + high) / 2;
      const candidate = await encodePdf(workingCanvases, pageRecords, quality, "compressing");
      if (candidate.byteLength <= data.targetSizeKB * 1024) {
        bestPdf = candidate;
        bestQuality = quality;
        low = quality;
      } else {
        high = quality;
      }
      if (candidate.byteLength <= data.targetSizeKB * 1024 && candidate.byteLength >= data.targetSizeKB * 1024 * 0.95) break;
    }

    if (bestPdf.byteLength > data.targetSizeKB * 1024) {
      throw new CompressionWorkerError("unreachable", `The compressed PDF is still larger than ${data.targetSizeKB} KB.`);
    }
    postProgress("assembling", source.numPages, source.numPages);
    return { bytes: bestPdf, mimeType: "application/pdf" as const, quality: bestQuality, pages: source.numPages };
  } catch (caught) {
    if (caught instanceof CompressionWorkerError) throw caught;
    throw new CompressionWorkerError("processing", caught instanceof Error ? caught.message : "The PDF could not be compressed.");
  } finally {
    clearCanvases(workingCanvases);
    for (const { page } of pageRecords) page.cleanup();
    await loadingTask?.destroy().catch(() => undefined);
    pdfjs.GlobalWorkerOptions.workerPort = null;
    pdfWorkerPort?.terminate();
  }
}

async function renderPages(records: PdfPageRecord[], scale: number) {
  const canvases: OffscreenCanvas[] = [];
  try {
    for (let index = 0; index < records.length; index += 1) {
      const { page } = records[index];
      const viewport = page.getViewport({ scale });
      const width = Math.max(1, Math.ceil(viewport.width));
      const height = Math.max(1, Math.ceil(viewport.height));
      if (width * height > MAX_IMAGE_PIXELS) throw new CompressionWorkerError("unreachable", "A PDF page is too large to render safely in browser memory.");
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new CompressionWorkerError("processing", "The browser could not allocate a PDF page canvas.");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, width, height);
      postProgress("rendering", index, records.length);
      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
        background: "#ffffff",
      }).promise;
      canvases.push(canvas);
      page.cleanup();
      postProgress("rendering", index + 1, records.length);
    }
    return canvases;
  } catch (error) {
    clearCanvases(canvases);
    throw error;
  }
}

async function encodePdf(canvases: OffscreenCanvas[], records: PdfPageRecord[], quality: number, phase: "compressing") {
  const output = await PDFDocument.create();
  for (let index = 0; index < canvases.length; index += 1) {
    const { width, height } = records[index];
    const imageBlob = await canvases[index].convertToBlob({ type: "image/jpeg", quality });
    if (!imageBlob.size || imageBlob.type !== "image/jpeg") throw new CompressionWorkerError("unsupported", "The browser could not encode a PDF page as JPEG.");
    const jpeg = await output.embedJpg(await imageBlob.arrayBuffer());
    const outputPage = output.addPage([width, height]);
    outputPage.drawImage(jpeg, { x: 0, y: 0, width, height });
    postProgress(phase, index + 1, canvases.length);
  }
  return output.save({ useObjectStreams: true });
}

function clearCanvases(canvases: OffscreenCanvas[]) {
  for (const canvas of canvases) {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function postProgress(phase: ProgressMessage["phase"], pagesDone = 0, pagesTotal = 0) {
  workerScope.postMessage({ type: "progress", phase, pagesDone, pagesTotal });
}

class CompressionWorkerError extends Error {
  constructor(readonly kind: "invalid" | "unsupported" | "unreachable" | "processing", message: string) {
    super(message);
    this.name = "CompressionWorkerError";
  }
}