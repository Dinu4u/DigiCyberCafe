"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, ImagePlus, LoaderCircle, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useBackgroundRemoval, type BackgroundMode, type RemovalError } from "@/lib/hooks/useBackgroundRemoval";

type CompareMode = "slider" | "split";
type Format = "image/png" | "image/jpeg";

type ErrorState = RemovalError;

export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropUrl, setBackdropUrl] = useState("");
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("transparent");
  const [customColor, setCustomColor] = useState("#F3F4F6");
  const [targetKB, setTargetKB] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>("slider");
  const [splitPosition, setSplitPosition] = useState(50);
  const [uiError, setUiError] = useState<ErrorState | null>(null);
  const [notice, setNotice] = useState("");

  const { canvasRef, status, progress, error, outputBlob, outputDimensions, reset, exportImage } = useBackgroundRemoval(file, backgroundMode, customColor, backdropFile);
  const activeError = uiError ?? error;
  const busy = status === "downloading-model" || status === "processing";

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);
  useEffect(() => () => {
    if (backdropUrl) URL.revokeObjectURL(backdropUrl);
  }, [backdropUrl]);

  async function selectPhoto(selected?: File) {
    if (!selected) return;
    setUiError(null);
    setNotice("");
    const validMime = ["image/jpeg", "image/png", "image/webp"].includes(selected.type);
    const validExtension = /\.(jpe?g|png|webp)$/i.test(selected.name);
    if (!validMime && !validExtension) {
      setPhotoError("Invalid or corrupted image format.", "corrupt");
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setPhotoError("The image is larger than 50 MB and may exhaust browser memory.", "memory");
      return;
    }
    try {
      const bitmap = await createImageBitmap(selected);
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (pixels > 60_000_000) {
        setPhotoError("The photo is too large to process safely in this browser.", "memory");
        return;
      }
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceUrl(URL.createObjectURL(selected));
      setFile(selected);
      setNotice("Your photo stays on this device. Model files download to the browser on first use.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The browser could not decode this image.";
      setPhotoError(message, /memory|allocation|quota/i.test(message) ? "memory" : "corrupt");
    }
  }

  function selectBackdrop(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setUiError({ scenario: "corrupt", title: "Unsupported backdrop", message: "The replacement background is not a supported image.", steps: ["Choose a JPG, PNG, or WebP backdrop.", "Try a smaller image if decoding fails."] });
      return;
    }
    if (backdropUrl) URL.revokeObjectURL(backdropUrl);
    setBackdropUrl(URL.createObjectURL(selected));
    setBackdropFile(selected);
    setBackgroundMode("image");
    setUiError(null);
  }

  function setPhotoError(message: string, scenario: RemovalError["scenario"]) {
    const content = recoveryContent(scenario, message);
    setUiError(content);
    setFile(null);
    setSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }

  function clearImage() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl("");
    setFile(null);
    setUiError(null);
    setNotice("");
    reset();
  }

  async function download(formatToSave: Format) {
    setUiError(null);
    try {
      const outputTargetKB = targetKB !== null && Number.isFinite(targetKB) && targetKB > 0 ? targetKB : null;
      const result = await exportImage({ format: formatToSave, targetSizeKB: outputTargetKB, backgroundMode, customColor, backdrop: backdropFile });
      const extension = formatToSave === "image/png" ? "png" : "jpg";
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFileBase(file?.name ?? "image")}-background-removed.${extension}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice(`Export ready: ${result.width} × ${result.height}px · ${(result.blob.size / 1024).toFixed(1)} KB.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The processed image could not be exported.";
      setUiError(recoveryContent(/memory|allocation|quota/i.test(message) ? "memory" : "unknown", message));
    }
  }

  return <section className="mx-auto max-w-7xl space-y-7 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-10">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.14em] text-emerald-800 dark:text-emerald-300">PRIVATE IMAGE TOOL</p><h1 className="mt-2 text-3xl font-semibold">Image Background Remover</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Remove a photo background locally with AI. Your image is never uploaded.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={14} className="text-emerald-600" /> Runs on this device</span></header>

    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(290px,350px)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Background removal controls">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-widest text-slate-500">01 / INPUT</p><h2 className="mt-1 text-lg font-semibold">Choose an image</h2></div>{file && <button className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600" onClick={clearImage}><RotateCcw size={14} /> Clear</button>}</div>
        <label className="relative grid min-h-36 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"><span className="grid justify-items-center gap-2"><ImagePlus size={24} className="text-emerald-700 dark:text-emerald-300" /><strong className="text-sm">{file ? file.name : "Drop an image here or browse"}</strong><small className="text-xs text-slate-500">JPG, PNG, or WebP · up to 50 MB</small></span><input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectPhoto(event.target.files?.[0])} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectPhoto(event.dataTransfer.files?.[0]); }} /></label>
        <label className="grid gap-2 text-xs font-medium">Replacement background<select value={backgroundMode} onChange={(event) => setBackgroundMode(event.target.value as BackgroundMode)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="transparent">Transparent</option><option value="white">Clean white</option><option value="blue">Passport blue</option><option value="gray">Soft gray</option><option value="custom">Custom color</option><option value="image">Custom backdrop image</option></select></label>
        {backgroundMode === "custom" && <label className="flex items-center justify-between gap-3 text-xs">Custom fill color<input type="color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} className="h-9 w-12 rounded border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950" /></label>}
        {backgroundMode === "image" && <label className="relative flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-xs dark:border-slate-700"><ImagePlus size={15} />{backdropFile?.name ?? "Upload replacement backdrop"}<input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectBackdrop(event.target.files?.[0])} /></label>}
        <label className="grid gap-2 text-xs font-medium">Export size (KB)
          <div className="flex items-center gap-2">
            <input type="number" min={1} step={1} value={targetKB ?? ""} placeholder="Enter KB" onChange={(event) => {
              const rawValue = event.target.value;
              setTargetKB(rawValue === "" ? null : Number(rawValue));
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" />
            <button type="button" onClick={() => setTargetKB(null)} className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-2 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Original</button>
          </div>
        </label>
        <p className="rounded-md bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-300">MODNet model weights download to your browser on first use. The selected image is processed locally and is not uploaded.</p>
      </section>

      <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Background removal preview">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold tracking-widest text-slate-500">02 / PREVIEW</p><h2 className="mt-1 text-lg font-semibold">Before &amp; after</h2></div><div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800"><button onClick={() => setCompareMode("slider")} aria-pressed={compareMode === "slider"} className={`rounded px-3 py-1.5 text-xs ${compareMode === "slider" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>Slider</button><button onClick={() => setCompareMode("split")} aria-pressed={compareMode === "split"} className={`rounded px-3 py-1.5 text-xs ${compareMode === "split" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>Split</button></div></div>
        <ErrorAlert error={activeError} />
        {notice && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" role="status">{notice}</p>}
        {status === "downloading-model" || status === "processing" ? <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-900 dark:bg-emerald-950"><div className="flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" />{progress?.message ?? "Processing image locally…"}</div><progress className="h-1.5 w-full accent-emerald-700" max={100} value={progress?.progress ?? 0} /><p className="text-slate-500 dark:text-slate-400">{progress?.status === "downloading-model" ? `Model download ${progress.progress}%` : "Running local segmentation"}</p></div> : null}
        <div aria-busy={busy} className={`relative grid aspect-[4/3] min-h-[300px] overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] dark:border-slate-700`} style={{ backgroundColor: backgroundMode === "white" ? "#fff" : backgroundMode === "blue" ? "#3B82F6" : backgroundMode === "gray" ? "#E5E7EB" : backgroundMode === "custom" ? customColor : undefined }}>
          {!file ? <div className="grid place-content-center justify-items-center gap-2 p-6 text-center text-sm text-slate-500"><ImagePlus size={28} /><span>Upload a photo to see the before-and-after preview.</span></div> : compareMode === "slider" ? <div className="relative h-full w-full"><Image fill unoptimized src={sourceUrl} alt="Original image before background removal" className="object-contain" /><canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }} /><span className="absolute left-3 top-3 rounded bg-slate-950/65 px-2 py-1 text-[10px] text-white">Before</span><span className="absolute right-3 top-3 rounded bg-emerald-800/80 px-2 py-1 text-[10px] text-white">After</span><input aria-label="Before and after comparison" type="range" min="0" max="100" value={splitPosition} onChange={(event) => setSplitPosition(Number(event.target.value))} className="absolute bottom-3 left-4 right-4 z-10 w-[calc(100%-2rem)] accent-emerald-700" /></div> : <div className="grid h-full w-full grid-cols-2 bg-white dark:bg-slate-900"><div className="relative min-w-0"><Image fill unoptimized src={sourceUrl} alt="Original image" className="object-contain" /><span className="absolute left-2 top-2 rounded bg-slate-950/65 px-2 py-1 text-[10px] text-white">Before</span></div><div className="relative min-w-0"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" /><span className="absolute right-2 top-2 rounded bg-emerald-800/80 px-2 py-1 text-[10px] text-white">After</span></div></div>}
          {file && status === "ready" && outputDimensions.width > 0 && <span className="absolute bottom-3 right-3 rounded bg-slate-950/70 px-2 py-1 text-[10px] text-white">{outputDimensions.width} × {outputDimensions.height}px</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button onClick={() => void download("image/png")} disabled={status !== "ready"} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950"><Download size={15} /> Transparent PNG</button><button onClick={() => void download("image/jpeg")} disabled={status !== "ready"} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-xs font-semibold disabled:opacity-50 dark:border-slate-700"><Download size={15} /> JPEG</button></div><span className="text-xs text-slate-500">{outputBlob ? `${(outputBlob.size / 1024).toFixed(1)} KB preview` : status === "ready" ? `${outputDimensions.width} × ${outputDimensions.height}px` : ""}</span></div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Fine hair, veils, glasses, translucent materials, or similar foreground/background colors may need manual touch-up in an image editor. Large images are downscaled for inference; exports are capped to 4000px on the longest edge to protect browser memory.</p>
      </section>
    </div>
  </section>;
}

function ErrorAlert({ error }: { error: RemovalError | null }) {
  if (!error) return null;
  return <section className="space-y-2 rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:border-l-red-400 dark:bg-red-950 dark:text-red-100" role="alert"><div className="flex items-start gap-3"><X size={18} className="mt-0.5 shrink-0" /><div><p className="text-[10px] font-bold uppercase tracking-wide">{error.title}</p><p className="mt-1 text-sm font-semibold">{error.message}</p><h3 className="mt-3 text-xs font-semibold">What to do next</h3><ol className="mt-1 list-inside list-decimal space-y-1 text-xs leading-relaxed">{error.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div></section>;
}

function recoveryContent(scenario: RemovalError["scenario"], detail: string): RemovalError {
  if (scenario === "memory") return { scenario, title: "Browser / Device Memory Exhausted", message: "Out of browser memory while processing image.", steps: ["The uploaded image resolution is too high for your browser's current memory. Please resize your image below 2000px, or close other heavy browser tabs and try again.", "Upload the resized photo and run background removal again."] };
  if (scenario === "acceleration") return { scenario, title: "WebAssembly / WebGPU Acceleration Blocked", message: "Hardware acceleration / AI engine could not initialize.", steps: ["Check if your browser supports WebAssembly or disable strict adblockers that may be blocking local worker assets. Trying Chrome or Edge usually resolves this.", "Allow the model files to download, then retry."] };
  if (scenario === "no-subject") return { scenario, title: "No Clear Foreground Detected", message: "Could not separate foreground subject from background.", steps: ["Ensure the photo has clear contrast between the subject and the surroundings. Avoid heavily blurred or underexposed photos.", "Try a clearer image with a single, centered subject."] };
  if (scenario === "corrupt") return { scenario, title: "Corrupted or Unsupported File", message: "Invalid or corrupted image format.", steps: ["Please upload a valid JPG, PNG, or WebP file.", "If taking photos on iPhone, convert HEIC to JPG before uploading.", "Try exporting the image again if it remains unreadable."] };
  return { scenario, title: "Background removal failed", message: detail || "The browser could not finish this operation.", steps: ["Try an image under 2000px on its longest edge.", "Check browser memory and WebAssembly support.", "Clear the image and retry." ] };
}

function safeFileBase(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return base || "image";
}
