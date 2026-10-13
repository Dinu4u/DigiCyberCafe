"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Download, FileImage, ImagePlus, LoaderCircle, RotateCcw } from "lucide-react";
import { useExamPhotoCanvas, type ExamPhotoPreset, type PhotoCanvasError } from "@/lib/hooks/useExamPhotoCanvas";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
type WorkerResult =
  | { type: "success"; imageData: ArrayBuffer; outputFormat: OutputFormat; width: number; height: number; sizeKB: number; quality: number; scale: number }
  | { type: "failure"; kind: string; message: string };

type UiError = { title: string; message: string; steps: string[] };

export function ExamPhotoGenerator() {
  const workerRef = useRef<Worker | null>(null);
  const workerAbortRef = useRef<AbortController | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayLocalDate);
  const [labelPrefix, setLabelPrefix] = useState<"DOP:" | "DATE:" | "">("DOP:");
  const [preset, setPreset] = useState<ExamPhotoPreset>("ssc-upsc");
  const [customWidth, setCustomWidth] = useState(413);
  const [customHeight, setCustomHeight] = useState(531);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [targetSizeKB, setTargetSizeKB] = useState<number | null>(45);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [estimatedKB, setEstimatedKB] = useState<number | null>(null);
  const [compressedKB, setCompressedKB] = useState<number | null>(null);
  const [compressionStatus, setCompressionStatus] = useState("Ready to generate");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<UiError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    workerAbortRef.current?.abort();
    workerRef.current?.terminate();
  }, []);

  const { canvasRef, dimensions, renderError, renderVersion, ready } = useExamPhotoCanvas({
    source: photo,
    name,
    date,
    labelPrefix,
    preset,
    customWidth,
    customHeight,
    fontSizeOffset,
  });

  const activeError = error ?? (renderError ? convertHookError(renderError) : null);
  const currentCompressionStatus = activeError ? "Needs attention" : compressionStatus;
  const fileExtension = outputFormat === "image/png" ? "png" : outputFormat === "image/webp" ? "webp" : "jpg";

  useEffect(() => {
    if (!ready || !canvasRef.current) {
      setEstimatedKB(null);
      return;
    }
    let active = true;
    const canvas = canvasRef.current;
    try {
      canvas.toBlob((blob) => {
        if (active) setEstimatedKB(blob ? blob.size / 1024 : null);
      }, outputFormat, 0.92);
    } catch {
      window.setTimeout(() => { if (active) setEstimatedKB(null); }, 0);
    }
    return () => { active = false; };
  }, [canvasRef, renderVersion, outputFormat, ready]);

  const onSelectFile = useCallback(async (file?: File) => {
    if (!file) return;
    setError(null);
    setNotice("");
    setCompressedKB(null);
    const supportedImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!supportedImage) {
      setPhoto(null);
      setError({
        title: "Invalid File Format",
        message: "Unsupported image format.",
        steps: ["Please upload a standard JPG, PNG, or WebP photo.", "If you took the photo on an iPhone in HEIC mode, convert or screenshot it first.", "Select the converted image and try again."],
      });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPhoto(null);
      setError({ title: "Image is too large to open safely", message: "This image may exceed the memory available in your browser.", steps: ["Resize or export the image at a smaller resolution.", "Keep the file below 25 MB.", "Upload the smaller JPG, PNG, or WebP file again."] });
      return;
    }
    try {
      if (typeof createImageBitmap !== "function") throw new Error("This browser cannot inspect image dimensions.");
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (width * height > 50_000_000) {
        setPhoto(null);
        setError({ title: "Image dimensions are too large", message: "This photo has too many pixels to process reliably in one pass.", steps: ["Resize the photo to 6000 pixels or less on its longest side.", "Keep the image below 50 megapixels.", "Upload the resized image again."] });
        return;
      }
      setPhoto(file);
      setCompressionStatus("Preview ready");
    } catch (caught) {
      setPhoto(null);
      setError({
        title: "Invalid File Format",
        message: caught instanceof Error ? caught.message : "Unsupported image format.",
        steps: ["Please upload a standard JPG, PNG, or WebP photo.", "If the image is corrupted, export it again from your photo app.", "Try another image file."],
      });
    }
  }, []);

  async function downloadPhoto() {
    if (!photo) {
      setError({ title: "No photo selected", message: "Choose a photo before generating the exam image.", steps: ["Upload a JPG, PNG, or WebP photo.", "Enter the candidate name and date.", "Choose a preset and retry the download."] });
      return;
    }
    if (!ready || !canvasRef.current) {
      setError({ title: "Photo preview is not ready", message: "The image has not finished rendering yet.", steps: ["Wait for the preview to finish rendering.", "Try a standard dimension preset.", "Upload the image again if the preview remains blank."] });
      return;
    }

    setError(null);
    setNotice("");
    setBusy(true);
    setCompressionStatus(targetSizeKB === null ? "Preparing original-size export" : "Compressing in background");
    try {
      let output: Blob;
      if (targetSizeKB === null) {
        output = await canvasToBlob(canvasRef.current, outputFormat, 0.96);
      } else {
        try {
          const workerAbort = new AbortController();
          workerAbortRef.current = workerAbort;
          output = await compressInWorker(
            canvasRef.current,
            targetSizeKB,
            outputFormat,
            workerAbort.signal,
            (worker) => {
              workerRef.current = worker;
              if (!worker) workerAbortRef.current = null;
            },
          );
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
          if (caught instanceof CompressionResultError && caught.kind === "target-impossible") throw caught;
          const fallbackResult = await compressOnMainThread(canvasRef.current, targetSizeKB, outputFormat);
          output = fallbackResult.blob;
          setNotice("Notice: Background acceleration unavailable on this browser. Processed using standard browser fallback.");
        }
      }
      if (targetSizeKB !== null && output.size > targetSizeKB * 1024) {
        throw new CompressionResultError("target-impossible", `Cannot compress below ${targetSizeKB} KB without unreadable distortion.`);
      }
      const filename = makeFilename(name, fileExtension);
      saveBlob(output, filename);
      setCompressedKB(output.size / 1024);
      setCompressionStatus("Download ready");
      setError(null);
    } catch (caught) {
      setCompressionStatus("Needs attention");
      if (caught instanceof CompressionResultError && caught.kind === "target-impossible") {
        setError({
          title: "Target Size Impossible to Reach",
          message: `Cannot compress below ${targetSizeKB} KB without unreadable distortion.`,
          steps: ["Try selecting a slightly higher target size, such as 20 KB or 50 KB.", "Choose a smaller dimension preset like SSC/UPSC 3.5 × 4.5 cm.", "Use Original / Uncompressed if preserving image quality is more important than file size."],
        });
      } else {
        setError({
          title: "Could not prepare this photo",
          message: caught instanceof Error ? caught.message : "The browser could not finish processing this photo.",
          steps: ["Clear the current photo and upload it again.", "Try a smaller image or the SSC/UPSC preset.", "If background processing is unavailable, retry with Original / Uncompressed."],
        });
      }
    } finally {
      setBusy(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setEstimatedKB(null);
    setCompressedKB(null);
    setCompressionStatus("Ready to generate");
    setNotice("");
    setError(null);
  }

  const sizeLabel = useMemo(() => `${dimensions.width} × ${dimensions.height} px`, [dimensions.width, dimensions.height]);

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold tracking-[0.14em] text-emerald-800 dark:text-emerald-300">EXAM PHOTO TOOL</p><h1 className="mt-2 text-3xl font-semibold">Photo with Name &amp; Date (DOP)</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Create an exam-ready photo and resize it for strict upload limits. Processing stays in this browser.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-500" />Offline processing</div>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-widest text-slate-500">01 / PHOTO & DETAILS</p><h2 className="mt-1 text-lg font-semibold">Candidate information</h2></div>{photo && <button className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600" onClick={clearPhoto}><RotateCcw size={14} /> Clear photo</button>}</div>

          <label className="relative grid min-h-36 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"><span className="grid justify-items-center gap-2"><ImagePlus size={24} className="text-emerald-700 dark:text-emerald-300" /><strong className="text-sm">{photo ? photo.name : "Drop a photo here or browse"}</strong><small className="text-xs text-slate-500">JPG, PNG, or WebP · minimum 200 × 200 px</small></span><input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onSelectFile(event.target.files?.[0])} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void onSelectFile(event.dataTransfer.files?.[0]); }} /></label>

          <label className="grid gap-1.5 text-xs font-medium">Candidate name<input value={name} onChange={(event) => setName(event.target.value.toLocaleUpperCase())} maxLength={100} placeholder="A. K. SHARMA" className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium">Date of photo<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" /></label><label className="grid gap-1.5 text-xs font-medium">Date label<select value={labelPrefix} onChange={(event) => setLabelPrefix(event.target.value as typeof labelPrefix)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"><option value="DOP:">DOP: DD/MM/YYYY</option><option value="DATE:">DATE: DD/MM/YYYY</option><option value="">No prefix</option></select></label></div>

          <fieldset className="space-y-2"><legend className="text-xs font-medium">Photo dimensions</legend><div className="grid grid-cols-3 gap-2"><PresetButton active={preset === "ssc-upsc"} onClick={() => setPreset("ssc-upsc")}>SSC / UPSC<span>3.5 × 4.5 cm</span></PresetButton><PresetButton active={preset === "passport"} onClick={() => setPreset("passport")}>Passport<span>2 × 2 inch</span></PresetButton><PresetButton active={preset === "custom"} onClick={() => setPreset("custom")}>Custom<span>Width × Height</span></PresetButton></div>{preset === "custom" && <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">Width (px)<input type="number" min="100" max="4000" value={customWidth} onChange={(event) => setCustomWidth(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">Height (px)<input type="number" min="100" max="4000" value={customHeight} onChange={(event) => setCustomHeight(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label></div>}</fieldset>

          <label className="grid gap-2 text-xs font-medium">Name font adjustment <span className="font-normal text-slate-500">{fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}px</span><input type="range" min="-4" max="8" value={fontSizeOffset} onChange={(event) => setFontSizeOffset(Number(event.target.value))} className="accent-emerald-700" /></label>
          <label className="grid gap-2 text-xs font-medium">Target file size (KB)
            <div className="flex items-center gap-2">
              <input type="number" min={1} step={1} value={targetSizeKB ?? ""} placeholder="Enter KB" onChange={(event) => {
                const rawValue = event.target.value;
                setTargetSizeKB(rawValue === "" ? null : Number(rawValue));
                setCompressedKB(null);
              }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" />
              <button type="button" onClick={() => { setTargetSizeKB(null); setCompressedKB(null); }} className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-2 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Original</button>
            </div>
          </label>
          <label className="grid gap-1.5 text-xs font-medium">Output format<select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as OutputFormat)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="image/png">PNG</option><option value="image/jpeg">JPEG / JPG</option><option value="image/webp">WebP</option></select></label>
        </section>

        <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-widest text-slate-500">02 / PREVIEW & EXPORT</p><h2 className="mt-1 text-lg font-semibold">Exam-ready photo</h2></div><div className="text-xs text-slate-500 dark:text-slate-400">{sizeLabel}</div></div>
          <div className="space-y-3">
            <ErrorAlert error={activeError} />
            {notice && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="status">{notice}</p>}
            <div className="grid min-h-[420px] place-items-center overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950"><div className="relative overflow-hidden bg-white shadow-lg" style={{ width: `min(100%, ${Math.max(240, dimensions.width * Math.min(1, 420 / dimensions.height))}px)` }}><canvas ref={canvasRef} className="block h-auto w-full" aria-label="Live exam photo preview" />{!photo && <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-white/90 px-5 text-center text-sm text-slate-500"><FileImage size={28} /><span>Upload a photo to preview the name and date strip.</span></div>}</div></div>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950 sm:grid-cols-3"><Readout label="Rendered size" value={sizeLabel} /><Readout label="Estimated file size" value={activeError || estimatedKB === null ? "—" : `${estimatedKB.toFixed(1)} KB`} /><Readout label="Compression" value={currentCompressionStatus} />{compressedKB !== null && <Readout label="Downloaded size" value={`${compressedKB.toFixed(1)} KB`} />}</dl>
          <div className="flex justify-end"><button onClick={() => void downloadPhoto()} disabled={busy || !ready || Boolean(activeError)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Download size={16} />}{busy ? "Processing…" : "Download Exam Photo"}</button></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Filename: <strong className="font-medium text-slate-700 dark:text-slate-200">{makeFilename(name, fileExtension)}</strong></p>
        </section>
      </div>
    </div>
  </main>;
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`grid gap-1 rounded-md border px-2 py-2.5 text-left text-xs transition ${active ? "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100" : "border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"}`}>{children}</button>;
}

function Readout({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 truncate font-medium text-slate-800 dark:text-slate-100">{value}</dd></div>;
}

function ErrorAlert({ error }: { error: UiError | PhotoCanvasError | null }) {
  if (!error) return null;
  return <section className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:border-l-red-400 dark:bg-red-950 dark:text-red-100" role="alert"><div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div><h3 className="text-sm font-semibold">{error.title}</h3><p className="mt-1 text-xs leading-relaxed">{error.message}</p><h4 className="mt-3 text-xs font-semibold">What to do next</h4><ol className="mt-1 list-inside list-decimal space-y-1 text-xs leading-relaxed">{error.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div></section>;
}

class CompressionResultError extends Error {
  constructor(readonly kind: "target-impossible", message: string) {
    super(message);
    this.name = "CompressionResultError";
  }
}

async function compressInWorker(
  renderedCanvas: HTMLCanvasElement,
  targetSizeKB: number,
  outputFormat: OutputFormat,
  signal: AbortSignal,
  setActiveWorker: (worker: Worker | null) => void,
) {
  if (typeof Worker === "undefined" || typeof createImageBitmap !== "function") throw new Error("Web Workers or ImageBitmap are not available.");
  const bitmap = await createImageBitmap(renderedCanvas);
  return new Promise<Blob>((resolve, reject) => {
    let settled = false;
    let worker: Worker;
    try {
      worker = new Worker(new URL("../../lib/workers/imageTargetCompressor.worker.ts", import.meta.url), { type: "module" });
    } catch (error) {
      bitmap.close();
      reject(error instanceof Error ? error : new Error("Could not start the background compression worker."));
      return;
    }
    setActiveWorker(worker);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      worker.terminate();
      setActiveWorker(null);
      callback();
    };
    const onAbort = () => finish(() => reject(new DOMException("Compression cancelled.", "AbortError")));
    if (signal.aborted) {
      bitmap.close();
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<WorkerResult>) => {
      if (data.type === "failure") {
        if (data.kind === "target-impossible") finish(() => reject(new CompressionResultError("target-impossible", data.message)));
        else finish(() => reject(new Error(data.message)));
        return;
      }
      if (data.imageData.byteLength === 0) {
        finish(() => reject(new Error("The image worker returned an empty result.")));
        return;
      }
      finish(() => resolve(new Blob([data.imageData], { type: data.outputFormat })));
    };
    worker.onerror = (event) => finish(() => reject(new Error(event.message || "The background worker stopped unexpectedly.")));
    try {
      worker.postMessage({ imageBitmap: bitmap, targetSizeKB, outputFormat }, [bitmap]);
    } catch (error) {
      bitmap.close();
      finish(() => reject(error instanceof Error ? error : new Error("Could not transfer the image to the worker.")));
    }
  });
}

async function compressOnMainThread(renderedCanvas: HTMLCanvasElement, targetSizeKB: number, outputFormat: OutputFormat) {
  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement("canvas");
    let width = renderedCanvas.width;
    let height = renderedCanvas.height;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser could not create a fallback canvas.");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(renderedCanvas, 0, 0);
    const targetBytes = targetSizeKB * 1024;
    let scale = 1;
    let minimumBlob = await canvasToBlob(canvas, outputFormat, 0.01);
    for (let attempt = 0; minimumBlob.size > targetBytes && attempt < 4; attempt += 1) {
      const scaleFactor = Math.sqrt(targetBytes / minimumBlob.size) * 0.95;
      const nextWidth = Math.max(1, Math.floor(width * scaleFactor));
      const nextHeight = Math.max(1, Math.floor(height * scaleFactor));
      if (nextWidth < 100 || nextHeight < 100 || nextWidth * nextHeight < 40_000) throw new CompressionResultError("target-impossible", `Cannot compress below ${targetSizeKB} KB without unreadable distortion.`);
      const nextCanvas = document.createElement("canvas");
      nextCanvas.width = nextWidth;
      nextCanvas.height = nextHeight;
      const nextContext = nextCanvas.getContext("2d", { alpha: false });
      if (!nextContext) throw new Error("The browser could not resize the fallback canvas.");
      nextContext.fillStyle = "#FFFFFF";
      nextContext.fillRect(0, 0, nextWidth, nextHeight);
      nextContext.drawImage(renderedCanvas, 0, 0, renderedCanvas.width, renderedCanvas.height, 0, 0, nextWidth, nextHeight);
      canvas.width = 0;
      canvas.height = 0;
      canvas = nextCanvas;
      width = nextWidth;
      height = nextHeight;
      scale *= scaleFactor;
      minimumBlob = await canvasToBlob(canvas, outputFormat, 0.01);
    }
    if (minimumBlob.size > targetBytes) throw new CompressionResultError("target-impossible", `Cannot compress below ${targetSizeKB} KB without unreadable distortion.`);
    let bestBlob = minimumBlob;
    let low = 0.01;
    let high = 0.99;
    for (let iteration = 0; iteration < 7; iteration += 1) {
      const quality = (low + high) / 2;
      const candidate = await canvasToBlob(canvas, outputFormat, quality);
      if (candidate.size <= targetBytes) {
        bestBlob = candidate;
        low = quality;
      } else high = quality;
      if (Math.abs(candidate.size - targetBytes) <= targetBytes * 0.05) break;
    }
    return { blob: bestBlob, scale };
  } catch (error) {
    if (error instanceof CompressionResultError) throw error;
    throw new Error(error instanceof Error ? error.message : "Main-thread fallback could not compress this image.");
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("The browser could not encode the photo. Try a smaller preset."));
        if (blob.type !== type) return reject(new Error(`This browser cannot encode ${type}. Choose the other output format.`));
        resolve(blob);
      }, type, quality);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("The browser could not encode the photo."));
    }
  });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function makeFilename(name: string, extension: string) {
  const safeName = name.trim().toLocaleUpperCase().normalize("NFKD").replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return safeName ? `${safeName}_exam_photo.${extension}` : `exam_passport_photo.${extension}`;
}

function todayLocalDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function convertHookError(error: PhotoCanvasError): UiError {
  return error;
}
