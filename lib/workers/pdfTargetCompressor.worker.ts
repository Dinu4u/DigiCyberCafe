import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type CompressionRequest = {
  pdfBuffer: ArrayBuffer;
  targetKB: number;
  tolerancePercentage?: number;
};

type CompressionProgress = {
  step: "rendering" | "compressing" | "assembling";
  pageCurrent: number;
  pageTotal: number;
  currentKB: number;
};

type CompressionResponse =
  | { success: true; pdfData: Uint8Array; finalSizeKB: number }
  | { success: false; error: string }
  | CompressionProgress;

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<CompressionRequest>) => void) | null;
  postMessage: (message: CompressionResponse) => void;
};

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

workerScope.onmessage = async ({ data }) => {
  let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null;
  try {
    const { pdfBuffer, targetKB, tolerancePercentage = 5 } = data;
    if (!(pdfBuffer instanceof ArrayBuffer) || !Number.isFinite(targetKB) || targetKB <= 0) {
      throw new Error("Provide a PDF and a target size greater than zero KB.");
    }
    const tolerance = Math.max(0, Math.min(50, tolerancePercentage));
    postProgress({ step: "rendering", pageCurrent: 0, pageTotal: 0, currentKB: 0 });

    loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer), useWorkerFetch: false });
    const source = await loadingTask.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      pages.push(await source.getPage(pageNumber));
    }
    const scales = [1.5, 1, 0.8];
    let bestImages: Uint8Array[] | undefined;
    let bestSize = Number.POSITIVE_INFINITY;
    const byteBudgetKB = Math.max(0.5, targetKB - Math.max(1.5, pages.length * 0.15));

    for (const scale of scales) {
      let low = 0.05;
      let high = 0.95;
      let scaleBest: Uint8Array[] | undefined;
      let scaleBestSize = Number.POSITIVE_INFINITY;
      let scaleBestQuality = 0;

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const quality = (low + high) / 2;
        const images: Uint8Array[] = [];
        let totalBytes = 0;

        for (let index = 0; index < pages.length; index += 1) {
          const page = pages[index];
          const viewport = page.getViewport({ scale });
          const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
          try {
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("This browser could not create an OffscreenCanvas context.");
            postProgress({ step: "rendering", pageCurrent: index + 1, pageTotal: pages.length, currentKB: totalBytes / 1024 });
            await page.render({ canvas: canvas as unknown as HTMLCanvasElement, canvasContext: context as unknown as CanvasRenderingContext2D, viewport, background: "#ffffff" }).promise;
            postProgress({ step: "compressing", pageCurrent: index + 1, pageTotal: pages.length, currentKB: totalBytes / 1024 });
            const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
            const bytes = new Uint8Array(await blob.arrayBuffer());
            images.push(bytes);
            totalBytes += bytes.byteLength;
          } finally {
            canvas.width = 0;
            canvas.height = 0;
            page.cleanup();
          }
        }

        const estimatedKB = totalBytes / 1024;
        postProgress({ step: "compressing", pageCurrent: pages.length, pageTotal: pages.length, currentKB: estimatedKB });
        if (estimatedKB <= byteBudgetKB && quality > scaleBestQuality) {
          scaleBest = images;
          scaleBestSize = estimatedKB;
          scaleBestQuality = quality;
        }

        const acceptableFloor = byteBudgetKB * (1 - tolerance / 100);
        if (estimatedKB <= targetKB && estimatedKB >= acceptableFloor) break;
        if (estimatedKB > byteBudgetKB) high = quality;
        else low = quality;
      }

      if (scaleBest && scaleBestSize < bestSize) {
        bestImages = scaleBest;
        bestSize = scaleBestSize;
      }
      if (scaleBest) break;
    }

    if (!bestImages) {
      await loadingTask.destroy();
      loadingTask = null;
      throw new Error(`This PDF could not be compressed below ${targetKB} KB. Try a higher target size.`);
    }

    postProgress({ step: "assembling", pageCurrent: 0, pageTotal: pages.length, currentKB: bestSize });
    const output = await PDFDocument.create();
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const viewport = page.getViewport({ scale: 1 });
      const outputPage = output.addPage([viewport.width, viewport.height]);
      const image = await output.embedJpg(bestImages[index]);
      outputPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      postProgress({ step: "assembling", pageCurrent: index + 1, pageTotal: pages.length, currentKB: bestSize });
      page.cleanup();
    }
    const pdfData = await output.save({ useObjectStreams: true });
    await loadingTask.destroy();
    loadingTask = null;
    const finalSizeKB = pdfData.byteLength / 1024;
    if (finalSizeKB > targetKB) throw new Error(`The output is ${finalSizeKB.toFixed(1)} KB, above the ${targetKB} KB target. Try increasing the target.`);
    workerScope.postMessage({ success: true, pdfData, finalSizeKB });
  } catch (error) {
    await loadingTask?.destroy().catch(() => undefined);
    workerScope.postMessage({ success: false, error: error instanceof Error ? error.message : "Could not compress this PDF." });
  }
};

function postProgress(progress: CompressionProgress) {
  workerScope.postMessage(progress);
}