"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AlertCircle, ArrowDownToLine, ChevronDown, ImagePlus, LoaderCircle, Redo2, RotateCcw, ShieldCheck, Sparkles, Undo2, X } from "lucide-react";
import { createEnhancerError, DEFAULT_ENHANCER_SETTINGS, type ExportFormat, type ImageEnhancerSettings, useImageEnhancer } from "@/lib/hooks/useImageEnhancer";

type ExportSize = "original" | "2x";
const FORMAT_OPTIONS: { mime: ExportFormat; label: string; extension: string }[] = [
  { mime: "image/jpeg", label: "JPG", extension: "jpg" },
  { mime: "image/png", label: "PNG", extension: "png" },
  { mime: "image/webp", label: "WebP", extension: "webp" },
];
const SETTING_DEFAULTS: ImageEnhancerSettings = { ...DEFAULT_ENHANCER_SETTINGS };

export function PhotoEnhancer() {
  const {
    sourceUrl,
    enhancedUrl,
    settings,
    status,
    error,
    notice,
    canUndo,
    canRedo,
    loadFile,
    clearImage,
    updateSetting,
    applyPreset,
    resetRecommended,
    undo,
    redo,
    autoDownscaleAndEnhance,
    exportImage,
    clearError,
  } = useImageEnhancer();
  const [filename, setFilename] = useState("photo");
  const [comparePosition, setComparePosition] = useState(50);
  const [zoom, setZoom] = useState<1 | 2>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("image/jpeg");
  const [quality, setQuality] = useState(88);
  const [exportSize, setExportSize] = useState<ExportSize>("original");
  const [exporting, setExporting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const busy = status === "processing" || status === "loading" || exporting;

  async function selectFile(file?: File) {
    if (!file) return;
    setFilename(file.name.replace(/\.[^.]+$/, "") || "photo");
    setComparePosition(50);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    await loadFile(file);
  }

  async function downloadEnhanced() {
    setExporting(true);
    try {
      const result = await exportImage({ upscale: exportSize === "2x", format: exportFormat, quality: quality / 100 });
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${filename}-enhanced${exportSize === "2x" ? "-2x" : ""}.${FORMAT_OPTIONS.find((option) => option.mime === exportFormat)?.extension ?? "jpg"}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch {
      return;
    } finally {
      setExporting(false);
    }
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (!sourceUrl || zoom === 1 || (event.target instanceof HTMLInputElement)) return;
    panStartRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStartRef.current || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    const limitX = bounds.width * 0.45;
    const limitY = bounds.height * 0.45;
    setPan({
      x: Math.max(-limitX, Math.min(limitX, panStartRef.current.panX + event.clientX - panStartRef.current.x)),
      y: Math.max(-limitY, Math.min(limitY, panStartRef.current.panY + event.clientY - panStartRef.current.y)),
    });
  }

  function stopPan() {
    panStartRef.current = null;
    setIsPanning(false);
  }

  function changeZoom(nextZoom: 1 | 2) {
    setZoom(nextZoom);
    if (nextZoom === 1) setPan({ x: 0, y: 0 });
  }

  function handleClear() {
    clearImage();
    setFilename("photo");
    setPan({ x: 0, y: 0 });
  }

  const presetButtons = [
    { id: "auto" as const, label: "Auto Fix", detail: "Balanced clarity" },
    { id: "portrait" as const, label: "Face / Portrait Glow", detail: "Gentle skin color" },
    { id: "document" as const, label: "Document & Text Sharpen", detail: "Crisp edges" },
    { id: "landscape" as const, label: "Vibrant Landscape", detail: "More color" },
  ];

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-300">PRIVATE IMAGE TOOL</p><h1 className="mt-2 text-3xl font-semibold">Photo Enhancer &amp; Upscaler</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Sharpen, balance, and upscale photos locally in your browser. Your image stays on this device.</p></div>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={14} className="text-emerald-600" /> Offline processing</span>
    </header>

    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Photo comparison">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold tracking-widest text-slate-500">01 / PREVIEW</p><h2 className="mt-1 text-lg font-semibold">Original and enhanced</h2></div>
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800" aria-label="Preview zoom">
            <button type="button" onClick={() => changeZoom(1)} aria-pressed={zoom === 1} className={`rounded px-2.5 py-1.5 text-xs ${zoom === 1 ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>100%</button>
            <button type="button" onClick={() => changeZoom(2)} aria-pressed={zoom === 2} disabled={!sourceUrl} className={`rounded px-2.5 py-1.5 text-xs disabled:opacity-40 ${zoom === 2 ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>200%</button>
          </div>
        </div>

        {error && <ErrorAlert error={error} onReset={resetRecommended} onDownscale={autoDownscaleAndEnhance} onDismiss={clearError} />}
        {notice && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{notice}</p>}

        <div ref={stageRef} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan} onLostPointerCapture={stopPan} className={`relative grid aspect-[4/3] min-h-[300px] max-h-[min(65vh,520px)] touch-none place-items-center overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] dark:border-slate-700 ${zoom === 2 && sourceUrl ? "cursor-grab active:cursor-grabbing" : ""}`}>
          {!sourceUrl ? <label className="absolute inset-0 grid cursor-pointer place-content-center justify-items-center gap-3 p-6 text-center">
            <ImagePlus size={30} className="text-emerald-700 dark:text-emerald-300" />
            <strong className="text-sm font-medium">Drop a photo here or browse</strong>
            <span className="text-xs text-slate-500">JPEG, PNG, or WebP · processed locally</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => void selectFile(event.target.files?.[0])} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files?.[0]); }} />
          </label> : <>
            <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", transition: isPanning ? "none" : "transform 0.12s ease-out" }}>
              <Image src={sourceUrl} alt="Original photo" fill unoptimized className="object-contain" draggable={false} />
              {enhancedUrl && <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}><Image src={enhancedUrl} alt="Enhanced photo preview" fill unoptimized className="object-contain" draggable={false} /></div>}
            </div>
            <span className="absolute left-3 top-3 z-10 rounded bg-slate-950/70 px-2 py-1 text-[10px] text-white">Original</span>
            <span className="absolute right-3 top-3 z-10 rounded bg-emerald-800/85 px-2 py-1 text-[10px] text-white">{status === "processing" ? "Updating…" : "Enhanced"}</span>
            {enhancedUrl && <>
              <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow" style={{ left: `${comparePosition}%` }} />
              <input aria-label="Before and after comparison" type="range" min="0" max="100" value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} className="absolute bottom-3 left-4 z-20 w-[calc(100%-2rem)] accent-emerald-700" />
            </>}
          </>}
          {busy && sourceUrl && <span className="pointer-events-none absolute bottom-11 right-3 z-30 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300"><LoaderCircle size={14} className="animate-spin text-emerald-700" />{exporting ? "Preparing export…" : "Enhancing locally…"}</span>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo adjustment" title="Undo" className="grid size-9 place-items-center rounded-md border border-slate-200 disabled:opacity-40 dark:border-slate-700"><Undo2 size={16} /></button><button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo adjustment" title="Redo" className="grid size-9 place-items-center rounded-md border border-slate-200 disabled:opacity-40 dark:border-slate-700"><Redo2 size={16} /></button>{sourceUrl && <button type="button" onClick={handleClear} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"><RotateCcw size={14} /> Clear</button>}</div>
          <span className="text-[11px] text-slate-500">{zoom === 2 ? "Drag to pan · 200%" : "100% view"}</span>
        </div>
      </section>

      <aside className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Enhancement settings">
        <div><p className="text-[10px] font-bold tracking-widest text-slate-500">02 / ENHANCE</p><h2 className="mt-1 text-lg font-semibold">Choose a look</h2></div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {presetButtons.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} disabled={!sourceUrl || busy} className="flex min-w-[185px] flex-1 items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:border-emerald-500"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><Sparkles size={15} /></span><span className="min-w-0"><strong className="block text-xs font-semibold">{preset.label}</strong><small className="mt-0.5 block text-[10px] text-slate-500">{preset.detail}</small></span></button>)}
        </div>

        <details className="group rounded-lg border border-slate-200 dark:border-slate-700">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-sm font-semibold"><span>Fine tuning</span><ChevronDown size={16} className="transition group-open:rotate-180" /></summary>
          <div className="grid gap-4 border-t border-slate-200 p-3 dark:border-slate-700">
            <SliderControl label="Brightness" value={settings.brightness} min={50} max={150} suffix="%" defaultValue={SETTING_DEFAULTS.brightness} onChange={(value) => updateSetting("brightness", value)} onReset={() => updateSetting("brightness", SETTING_DEFAULTS.brightness)} disabled={!sourceUrl || busy} />
            <SliderControl label="Contrast" value={settings.contrast} min={60} max={180} suffix="%" defaultValue={SETTING_DEFAULTS.contrast} onChange={(value) => updateSetting("contrast", value)} onReset={() => updateSetting("contrast", SETTING_DEFAULTS.contrast)} disabled={!sourceUrl || busy} />
            <SliderControl label="Clarity / Sharpening" value={settings.clarity} min={0} max={100} suffix="%" defaultValue={SETTING_DEFAULTS.clarity} onChange={(value) => updateSetting("clarity", value)} onReset={() => updateSetting("clarity", SETTING_DEFAULTS.clarity)} disabled={!sourceUrl || busy} />
            <SliderControl label="Exposure" value={settings.exposure} min={-2} max={2} step={0.1} suffix=" EV" defaultValue={SETTING_DEFAULTS.exposure} onChange={(value) => updateSetting("exposure", value)} onReset={() => updateSetting("exposure", SETTING_DEFAULTS.exposure)} disabled={!sourceUrl || busy} />
            <SliderControl label="Saturation" value={settings.saturation} min={0} max={160} suffix="%" defaultValue={SETTING_DEFAULTS.saturation} onChange={(value) => updateSetting("saturation", value)} onReset={() => updateSetting("saturation", SETTING_DEFAULTS.saturation)} disabled={!sourceUrl || busy} />
            <SliderControl label="Temperature" value={settings.temperature} min={-50} max={50} suffix="" defaultValue={SETTING_DEFAULTS.temperature} onChange={(value) => updateSetting("temperature", value)} onReset={() => updateSetting("temperature", SETTING_DEFAULTS.temperature)} disabled={!sourceUrl || busy} />
            <label className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><span><strong className="block font-medium">Denoise</strong><small className="mt-0.5 block text-[10px] text-slate-500">Median noise reduction</small></span><input type="checkbox" checked={settings.denoise} onChange={(event) => updateSetting("denoise", event.target.checked)} disabled={!sourceUrl || busy} className="size-4 accent-emerald-700" /></label>
          </div>
        </details>

        <div className="grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Export</h3><button type="button" onClick={resetRecommended} disabled={!sourceUrl} className="text-[11px] text-slate-500 hover:text-emerald-700 disabled:opacity-40 dark:text-slate-300">Reset to Recommended</button></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[10px] text-slate-500">Format<select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{FORMAT_OPTIONS.map((option) => <option key={option.mime} value={option.mime}>{option.label}</option>)}</select></label>
            <label className="grid gap-1 text-[10px] text-slate-500">Dimensions<select value={exportSize} onChange={(event) => setExportSize(event.target.value as ExportSize)} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="original">Original size</option><option value="2x">2× upscale</option></select></label>
          </div>
          {exportFormat !== "image/png" && <label className="grid gap-2 text-[11px] text-slate-600 dark:text-slate-300">Quality {quality}%<input type="range" min={40} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="accent-emerald-700" /></label>}
          <button type="button" onClick={() => void downloadEnhanced()} disabled={!sourceUrl || busy || status !== "ready"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950"><ArrowDownToLine size={16} />{exporting ? "Preparing…" : "Download enhanced photo"}</button>
        </div>
      </aside>
    </div>
  </main>;
}

function SliderControl({ label, value, min, max, step = 1, suffix, defaultValue, onChange, onReset, disabled }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  defaultValue: number;
  onChange: (value: number) => void;
  onReset: () => void;
  disabled: boolean;
}) {
  return <label className="grid gap-2 text-[11px] text-slate-600 dark:text-slate-300">
    <span className="flex items-center justify-between gap-3"><span>{label} <span className="text-slate-500">{value}{suffix}</span></span>{value !== defaultValue && <button type="button" onClick={onReset} disabled={disabled} className="text-[10px] text-slate-500 hover:text-emerald-700">Reset</button>}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} className="accent-emerald-700 disabled:opacity-40" />
  </label>;
}

function ErrorAlert({ error, onReset, onDownscale, onDismiss }: { error: ReturnType<typeof createEnhancerError>; onReset: () => void; onDownscale: () => void; onDismiss: () => void }) {
  return <section className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:border-l-red-400 dark:bg-red-950 dark:text-red-100" role="alert">
    <div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{error.title}</h3><p className="mt-1 text-xs leading-relaxed">{error.message}</p><ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-relaxed">{error.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      {error.scenario === "memory" && <button type="button" onClick={onDownscale} className="mt-3 rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white dark:bg-red-300 dark:text-red-950">Auto-Downscale &amp; Enhance</button>}
      {error.scenario === "artifacts" && <button type="button" onClick={onReset} className="mt-3 rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white dark:bg-red-300 dark:text-red-950">Reset to Recommended</button>}
    </div><button type="button" onClick={onDismiss} aria-label="Dismiss error" className="grid size-7 shrink-0 place-items-center rounded-full border border-red-200 dark:border-red-800"><X size={14} /></button></div>
  </section>;
}