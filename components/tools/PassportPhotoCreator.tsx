"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, FlipHorizontal2, ImagePlus, Info, LoaderCircle, RotateCcw, RotateCw, SlidersHorizontal, X } from "lucide-react";
import { PASSPORT_PRESETS, type CropRect, usePassportAdjustments } from "@/lib/hooks/usePassportAdjustments";

type ErrorState = { title: string; message: string; steps: string[] };

type WorkerResult =
  | { type: "success"; imageData: ArrayBuffer; outputFormat: "image/jpeg"; width: number; height: number; sizeKB: number; quality: number; scale: number }
  | { type: "failure"; kind: string; message: string };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function getDefaultCrop(aspect: number): CropRect {
  let width = 0.68;
  let height = width / aspect;
  if (height > 0.78) {
    height = 0.78;
    width = height * aspect;
  }
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

export function PassportPhotoCreator() {
  const workerRef = useRef<Worker | null>(null);
  const workerAbortRef = useRef<AbortController | null>(null);
  const {
    presetKey,
    setPresetKey,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    densityDpi,
    setDensityDpi,
    rotation,
    setRotation,
    zoom,
    setZoom,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation,
    flipHorizontal,
    setFlipHorizontal,
    aspectLock,
    setAspectLock,
    sourceUrl,
    bitmap,
    setBitmap,
    cropRect,
    setCropRect,
    selectedPreset,
    resetAdjustments,
    replaceImage,
    clearImage,
  } = usePassportAdjustments();

  const [error, setError] = useState<ErrorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [targetKB, setTargetKB] = useState<number | null>(45);
  const [showAlignmentGuide, setShowAlignmentGuide] = useState(false);
  const [activePanel, setActivePanel] = useState<"transform" | "adjustments" | null>(null);
  const [notice, setNotice] = useState("");
  const dragRef = useRef<{ startX: number; startY: number; crop: CropRect } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => {
    workerAbortRef.current?.abort();
    workerRef.current?.terminate();
  }, []);

  const previewFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  const handleFileInput = async (file?: File) => {
    if (!file) return;
    if (file.size <= 0) {
      setError({ title: "Unsupported or unreadable photo format.", message: "The uploaded file is empty.", steps: ["Please upload a valid JPG, PNG, or WebP photo.", "If your photo was captured in HEIC mode on an iPhone, convert it to JPG before uploading."] });
      return;
    }
    const supported = ["image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!supported) {
      setError({ title: "Unsupported or unreadable photo format.", message: "This photo format cannot be processed.", steps: ["Please upload a valid JPG, PNG, or WebP photo.", "HEIC, TIFF, SVG, PDF, and other desktop formats are not supported here."] });
      return;
    }
    try {
      setError(null);
      setNotice("");
      if (typeof createImageBitmap !== "function") {
        throw new Error("This browser cannot load image bitmaps.");
      }
      const nextBitmap = await createImageBitmap(file);
      setBitmap(nextBitmap);
      replaceImage(file);
      setCropRect(getDefaultCrop(nextBitmap.width / nextBitmap.height));
    } catch {
      setError({ title: "Unsupported or unreadable photo format.", message: "The photo file could not be decoded in the browser.", steps: ["Please upload a valid JPG, PNG, or WebP photo.", "If your photo was shot on an iPhone in HEIC mode, take a screenshot or convert it to JPG before uploading."] });
    }
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, crop: cropRect };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const deltaX = (event.clientX - dragRef.current.startX) / stageRect.width;
    const deltaY = (event.clientY - dragRef.current.startY) / stageRect.height;
    const nextCrop = { ...dragRef.current.crop, x: clamp(dragRef.current.crop.x + deltaX, 0, 1 - dragRef.current.crop.width), y: clamp(dragRef.current.crop.y + deltaY, 0, 1 - dragRef.current.crop.height) };
    dragRef.current = { ...dragRef.current, crop: nextCrop };
    setCropRect(nextCrop);
  };

  const handleCropPointerUp = () => {
    dragRef.current = null;
  };

  function validateCustomSizes() {
    const width = Number(customWidth);
    const height = Number(customHeight);
    const dpi = Number(densityDpi);
    if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(dpi)) {
      throw new Error("Invalid photo dimensions entered.");
    }
    if (width < 100 || height < 100 || width > 4000 || height > 4000 || dpi <= 0 || dpi > 600) {
      throw new Error("Invalid photo dimensions entered.");
    }
  }

  async function compressCanvasToBlob(
    canvas: HTMLCanvasElement,
    targetKB: number | null,
    signal: AbortSignal,
    outputFormat: "image/jpeg" = "image/jpeg",
  ) {
    if (targetKB === null || !Number.isFinite(targetKB) || targetKB <= 0) {
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("The browser could not encode the final photo."));
          resolve(blob);
        }, outputFormat, 0.92);
      });
    }

    const bitmap = await createImageBitmap(canvas);
    return new Promise<Blob>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL("../../lib/workers/imageTargetCompressor.worker.ts", import.meta.url), { type: "module" });
      } catch (error) {
        bitmap.close();
        reject(error instanceof Error ? error : new Error("Could not start the background compressor."));
        return;
      }
      workerRef.current = worker;
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (workerAbortRef.current?.signal === signal) workerAbortRef.current = null;
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
          if (data.kind === "target-impossible") {
            finish(() => reject(new Error(`Cannot achieve ${targetKB} KB target without extreme pixel distortion.`)));
            return;
          }
          finish(() => reject(new Error(data.message || "The background compressor could not finish.")));
          return;
        }
        finish(() => resolve(new Blob([data.imageData], { type: data.outputFormat })));
      };

      worker.onerror = (event) => {
        finish(() => reject(new Error(event.message || "Background compressor failed.")));
      };

      try {
        worker.postMessage({ imageBitmap: bitmap, targetSizeKB: Number(targetKB), outputFormat: "image/jpeg" }, [bitmap]);
      } catch {
        bitmap.close();
        finish(() => reject(new Error("Background compressor failed.")));
      }
    });
  }

  async function downloadPassportPhoto() {
    if (!bitmap) {
      setError({ title: "Unsupported or unreadable photo format.", message: "No photo has been loaded yet.", steps: ["Upload a JPG, PNG, or WebP portrait first.", "Make sure the file is not corrupted or empty."] });
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setNotice("");
      const workerAbort = new AbortController();
      workerAbortRef.current = workerAbort;
      const widthPx = Math.max(100, Math.round(selectedPreset.width));
      const heightPx = Math.max(100, Math.round(selectedPreset.height));
      const cropW = Math.max(200, Math.round(bitmap.width * cropRect.width));
      const cropH = Math.max(200, Math.round(bitmap.height * cropRect.height));

      if (cropW < 200 || cropH < 200) {
        throw Object.assign(new Error("Selected photo region is too small for passport printing."), { type: "small-region" });
      }

      if (presetKey === "custom") {
        validateCustomSizes();
      }

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = cropW;
      sourceCanvas.height = cropH;
      const sourceCtx = sourceCanvas.getContext("2d");
      if (!sourceCtx) throw new Error("The browser could not create a canvas context.");
      sourceCtx.fillStyle = "#FFFFFF";
      sourceCtx.fillRect(0, 0, cropW, cropH);

      sourceCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      sourceCtx.save();
      if (flipHorizontal) {
        sourceCtx.translate(cropW, 0);
        sourceCtx.scale(-1, 1);
      }
      sourceCtx.translate(cropW / 2, cropH / 2);
      sourceCtx.rotate((rotation * Math.PI) / 180);
      sourceCtx.drawImage(bitmap, Math.round(bitmap.width * cropRect.x), Math.round(bitmap.height * cropRect.y), cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
      sourceCtx.restore();

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = widthPx;
      finalCanvas.height = heightPx;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("The browser could not create the final canvas.");
      finalCtx.fillStyle = "#FFFFFF";
      finalCtx.fillRect(0, 0, widthPx, heightPx);
      finalCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      finalCtx.translate(widthPx / 2, heightPx / 2);
      finalCtx.rotate((rotation * Math.PI) / 180);
      const drawScale = Math.min(widthPx / sourceCanvas.width, heightPx / sourceCanvas.height) * (zoom / 100);
      finalCtx.drawImage(sourceCanvas, -sourceCanvas.width * drawScale / 2, -sourceCanvas.height * drawScale / 2, sourceCanvas.width * drawScale, sourceCanvas.height * drawScale);

      let blob: Blob;
      try {
        blob = await compressCanvasToBlob(finalCanvas, targetKB, workerAbort.signal, "image/jpeg");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const fallback = await new Promise<Blob>((resolve, reject) => {
          finalCanvas.toBlob((candidate) => {
            if (!candidate) return reject(new Error("The browser could not encode the final photo."));
            resolve(candidate);
          }, "image/jpeg", 0.8);
        });
        blob = fallback;
        setNotice("Background compressor unavailable. Downloaded using standard browser quality.");
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `passport_photo_${widthPx}x${heightPx}.jpg`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice(`Passport photo exported at ${blob.size / 1024} KB.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The passport photo could not be generated.";
      if (message.includes("too small") || message.includes("lower than 200x200")) {
        setError({ title: "Image Resolution Below Printable Standard", message: "Selected photo region is too small for passport printing.", steps: ["The cropped face is lower than 200x200 px and will be blurry when printed.", "Please zoom out or upload a higher-resolution portrait."] });
      } else if (message.includes("Invalid photo dimensions entered") || message.includes("width and height")) {
        setError({ title: "Invalid Custom Dimensions", message: "Invalid photo dimensions entered.", steps: ["Please enter a width and height between 100 px and 4000 px."] });
      } else if (message.includes("Cannot achieve") || message.includes("target without extreme pixel distortion")) {
        setError({ title: "Target KB Unreachable", message: `Cannot achieve ${targetKB ?? "selected"} KB target without extreme pixel distortion.`, steps: ["Increase the target size slightly, such as 20 KB or 50 KB.", "Switch to a smaller preset such as 3.5 × 4.5 cm if required."] });
      } else {
        setError({ title: "Passport photo could not be created.", message: message || "The current photo could not be processed.", steps: ["Try another portrait or a higher resolution image.", "Keep the crop area above 200 × 200 px for print quality."] });
      }
    } finally {
      setBusy(false);
    }
  }

  const customSizeDisabled = presetKey !== "custom";

  return <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-10">
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-300">PASSPORT PHOTO MAKER</p>
            <h1 className="mt-2 text-2xl font-semibold">Passport size photo</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowAlignmentGuide(true)} aria-label="Photo alignment guide" title="Photo alignment guide" className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-300"><Info size={16} /></button>
            <button type="button" onClick={() => setRotation((value) => value - 90)} disabled={!bitmap} aria-label="Rotate photo left" title="Rotate photo left" className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-300"><RotateCcw size={16} /></button>
            <button type="button" onClick={() => setRotation((value) => value + 90)} disabled={!bitmap} aria-label="Rotate photo right" title="Rotate photo right" className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-300"><RotateCw size={16} /></button>
            <button type="button" onClick={clearImage} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"><RotateCcw size={14} /> Clear</button>
          </div>
        </div>

        <label className={`relative flex min-h-[220px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 ${sourceUrl ? "h-[min(60vh,560px)]" : ""}`}>
          {sourceUrl ? <div className="relative h-full w-full overflow-hidden rounded-xl" ref={stageRef} onPointerMove={handleCropPointerMove} onPointerUp={handleCropPointerUp} onPointerLeave={handleCropPointerUp}><div className="relative h-full w-full"><Image unoptimized src={sourceUrl} alt="Passport photo source" fill className="object-contain" style={{ filter: previewFilter, transform: `scale(${zoom / 100}) rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1})`, transition: "transform 0.12s ease-out, filter 0.12s ease-out" }} /></div><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_68%,rgba(15,23,42,0.22)_100%)]" /><div onPointerDown={handleCropPointerDown} className="absolute border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.36)]" style={{ left: `${cropRect.x * 100}%`, top: `${cropRect.y * 100}%`, width: `${cropRect.width * 100}%`, height: `${cropRect.height * 100}%`, aspectRatio: `${selectedPreset.width}/${selectedPreset.height}` }}><div className="absolute inset-0 grid place-items-center text-[10px] font-semibold uppercase tracking-[0.20em] text-emerald-400">Crop</div></div></div> : <span className="grid justify-items-center gap-2"><ImagePlus size={28} className="text-emerald-600" /><strong className="text-base font-medium">Upload your passport or ID photo</strong><small className="max-w-xs text-sm text-slate-500">JPG, PNG, or WebP. Best with clear face, direct light, and plain background.</small></span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 opacity-0" onChange={(event) => void handleFileInput(event.target.files?.[0])} />
        </label>
        {activePanel && <section id="preview-control-section" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{activePanel === "transform" ? "Transform" : "Adjustments"}</h2>
            <button type="button" onClick={() => setActivePanel(null)} aria-label="Close preview controls" className="grid size-7 place-items-center rounded-full border border-slate-200 text-slate-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"><X size={14} /></button>
          </div>
          {activePanel === "transform" && <div className="grid gap-3 text-[11px] text-slate-600 dark:text-slate-300">
            <button type="button" onClick={() => setFlipHorizontal((value) => !value)} aria-label="Flip photo horizontally" title="Flip photo horizontally" className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"><FlipHorizontal2 size={15} /> Flip horizontal</button>
            <label className="grid gap-2">Fine rotation {rotation}°<input type="range" min={-45} max={45} value={rotation} onChange={(event) => setRotation(Number(event.target.value))} className="accent-emerald-700" /></label>
            <label className="grid gap-2">Zoom {zoom}%<input type="range" min={80} max={150} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="accent-emerald-700" /></label>
          </div>}
          {activePanel === "adjustments" && <div className="grid gap-3 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between"><span>Photo adjustments</span><button type="button" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-300" onClick={resetAdjustments}>Reset</button></div>
            <label className="grid gap-2">Brightness {brightness}%<input type="range" min={50} max={150} value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} className="accent-emerald-700" /></label>
            <label className="grid gap-2">Contrast {contrast}%<input type="range" min={50} max={150} value={contrast} onChange={(event) => setContrast(Number(event.target.value))} className="accent-emerald-700" /></label>
            <label className="grid gap-2">Saturation {saturation}%<input type="range" min={0} max={200} value={saturation} onChange={(event) => setSaturation(Number(event.target.value))} className="accent-emerald-700" /></label>
          </div>}
        </section>}
      </section>

      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-slate-500">SETUP</p>
            <h2 className="mt-1 text-lg font-semibold">Passport format</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setActivePanel((panel) => panel === "transform" ? null : "transform")} aria-expanded={activePanel === "transform"} aria-controls="preview-control-section" aria-label="Toggle transform controls below preview" title="Transform" className={`grid size-8 place-items-center rounded-full border transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:hover:text-emerald-300 ${activePanel === "transform" ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "border-slate-200 text-slate-600 dark:text-slate-300"}`}><RotateCw size={16} /></button>
              <button type="button" onClick={() => setActivePanel((panel) => panel === "adjustments" ? null : "adjustments")} aria-expanded={activePanel === "adjustments"} aria-controls="preview-control-section" aria-label="Toggle adjustment controls below preview" title="Adjustments" className={`grid size-8 place-items-center rounded-full border transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:hover:text-emerald-300 ${activePanel === "adjustments" ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "border-slate-200 text-slate-600 dark:text-slate-300"}`}><SlidersHorizontal size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.values(PASSPORT_PRESETS).map((preset) => (
              <button key={preset.id} type="button" onClick={() => setPresetKey(preset.id)} className={`rounded-lg border px-2.5 py-1.5 text-left text-[10px] leading-tight transition ${presetKey === preset.id ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>
                <div className="font-semibold">{preset.label}</div>
                <div className="mt-0.5 text-[9px] leading-tight opacity-80">{preset.description}</div>
              </button>
            ))}
          </div>

          <div className={`grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700 ${presetKey !== "custom" ? "opacity-80" : ""}`}>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"><span>Custom dimensions</span><button type="button" onClick={() => setAspectLock((value) => !value)} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] dark:border-slate-700">{aspectLock ? "Aspect lock on" : "Aspect lock off"}</button></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-[11px] text-slate-600 dark:text-slate-300">Width px<input type="number" min={100} max={4000} value={customWidth} onChange={(event) => setCustomWidth(Number(event.target.value))} disabled={customSizeDisabled} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="grid gap-1 text-[11px] text-slate-600 dark:text-slate-300">Height px<input type="number" min={100} max={4000} value={customHeight} onChange={(event) => setCustomHeight(Number(event.target.value))} disabled={customSizeDisabled} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950" /></label>
            </div>
            <label className="grid gap-1 text-[11px] text-slate-600 dark:text-slate-300">DPI<input type="number" min={72} max={600} value={densityDpi} onChange={(event) => setDensityDpi(Number(event.target.value))} disabled={customSizeDisabled} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950" /></label>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <label className="grid gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">Target file size (KB)
              <input type="number" min={5} max={300} step={1} value={targetKB ?? ""} placeholder="Leave blank for max quality" onChange={(event) => setTargetKB(event.target.value === "" ? null : Number(event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" />
            </label>
          </div>

          {error && <section className="rounded-xl border border-red-200 border-l-4 border-l-red-600 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:border-l-red-400 dark:bg-red-950 dark:text-red-100" role="alert"><div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div><h3 className="text-sm font-semibold">{error.title}</h3><p className="mt-1 text-xs leading-relaxed">{error.message}</p><ol className="mt-3 list-inside list-decimal space-y-1 text-xs leading-relaxed">{error.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div></section>}
          {notice && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{notice}</p>}

          <button type="button" onClick={() => void downloadPassportPhoto()} disabled={busy || !bitmap} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950">
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Download size={16} />}
            {busy ? "Generating…" : "Generate & Download Passport Photo"}
          </button>
        </div>
      </aside>
    </div>
    {showAlignmentGuide && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAlignmentGuide(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="alignment-guide-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-300">PHOTO ALIGNMENT GUIDE</p><h2 id="alignment-guide-title" className="mt-1 text-lg font-semibold">Position your face</h2></div>
          <button type="button" onClick={() => setShowAlignmentGuide(false)} aria-label="Close photo alignment guide" className="grid size-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"><X size={16} /></button>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950">Keep your face centered in the crop.</p>
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950">Look straight ahead with a neutral expression and level eyes.</p>
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950">Use even, direct light against a plain background.</p>
        </div>
      </section>
    </div>}
  </main>;
}
