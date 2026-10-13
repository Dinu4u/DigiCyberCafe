"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, AlertCircle, Check, FileText, ImagePlus, LoaderCircle, ShieldCheck, X } from "lucide-react";

type ProgressPhase = "reading" | "rendering" | "compressing" | "assembling";
type WorkerMessage =
  | { type: "progress"; phase: ProgressPhase; pagesDone: number; pagesTotal: number }
  | { type: "success"; resultData: ArrayBuffer; mimeType: "image/jpeg" | "application/pdf"; finalSizeKB: number; quality: number; width?: number; height?: number; pages?: number }
  | { type: "failure"; message: string; kind: "invalid" | "unsupported" | "unreachable" | "processing" };
type CompressionResult = Extract<WorkerMessage, { type: "success" }>;

const QUICK_TARGETS = [20, 50, 100, 200];
const MAX_FILE_BYTES = 100 * 1024 * 1024;

export function TargetSizeResizer() {
  const workerRef = useRef<Worker | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [targetKB, setTargetKB] = useState(200);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Extract<WorkerMessage, { type: "progress" }> | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => () => workerRef.current?.terminate(), []);
  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);
  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  function clearResult() {
    setResult(null);
    setResultUrl("");
    setProgress(null);
    setError("");
    setNotice("");
  }

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    clearResult();
    const isPdf = nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");
    const supportedImage = ["image/jpeg", "image/png", "image/webp"].includes(nextFile.type) || /\.(jpe?g|png|webp)$/i.test(nextFile.name);
    if (!isPdf && !supportedImage) {
      setFile(null);
      setSourceUrl("");
      setError("Choose a JPEG, PNG, WebP, or PDF file.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null);
      setSourceUrl("");
      setError("This file is larger than 100 MB. Resize or split it before processing in the browser.");
      return;
    }
    setFile(nextFile);
    setSourceUrl(URL.createObjectURL(nextFile));
    setError("");
  }

  async function compressFile() {
    if (!file) {
      setError("Choose a file before compressing.");
      return;
    }
    if (!Number.isFinite(targetKB) || targetKB < 1) {
      setError("Enter a target size of at least 1 KB.");
      return;
    }

    workerRef.current?.terminate();
    clearResult();
    setBusy(true);
    setError("");
    setProgress({ type: "progress", phase: "reading", pagesDone: 0, pagesTotal: 0 });

    try {
      const fileData = await file.arrayBuffer();
      const worker = new Worker(new URL("../../lib/workers/targetSizeCompressor.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
        if (data.type === "progress") {
          setProgress(data);
          return;
        }
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setBusy(false);
        setProgress(null);
        if (data.type === "failure") {
          setError(data.message);
          return;
        }
        if (!(data.resultData instanceof ArrayBuffer) || !Number.isFinite(data.finalSizeKB) || !Number.isFinite(data.quality) || !data.mimeType) {
          setError("The compression worker returned an incomplete result. Reload the page and try again.");
          return;
        }
        const blob = new Blob([data.resultData], { type: data.mimeType });
        const url = URL.createObjectURL(blob);
        setResult(data);
        setResultUrl(url);
        setNotice(data.finalSizeKB <= targetKB ? `Finished at ${data.finalSizeKB.toFixed(1)} KB.` : "The browser could not meet the target size.");
      };
      worker.onerror = () => {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setBusy(false);
        setProgress(null);
        setError("The compression worker stopped unexpectedly. Try a smaller file or another browser.");
      };
      worker.onmessageerror = () => {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setBusy(false);
        setProgress(null);
        setError("The browser could not receive the compression result. Try again with a smaller file.");
      };
      worker.postMessage({ fileData, fileName: file.name, mimeType: file.type, targetSizeKB: targetKB }, [fileData]);
    } catch (caught) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setBusy(false);
      setProgress(null);
      setError(caught instanceof Error ? caught.message : "The file could not be read in this browser.");
    }
  }

  function downloadResult() {
    if (!resultUrl || !result) return;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = `${file?.name.replace(/\.[^.]+$/, "") ?? "file"}-under-${targetKB}kb.${result.mimeType === "application/pdf" ? "pdf" : "jpg"}`;
    anchor.click();
  }

  function clearFile() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setFile(null);
    setSourceUrl("");
    clearResult();
  }

  const isPdf = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf") || false;
  const progressLabel = progress?.phase === "reading" ? "Reading file" : progress?.phase === "rendering" ? "Rendering PDF pages" : progress?.phase === "compressing" ? "Finding the best quality" : "Assembling compressed PDF";

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-300">PRIVATE FILE TOOL</p><h1 className="mt-2 text-3xl font-semibold">Reduce File Size</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Resize images and flatten PDFs to an exact file-size limit, right in your browser.</p></div>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={14} className="text-emerald-600" /> Never uploaded</span>
    </header>

    <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]" aria-label="Target size file resizer">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div><p className="text-[10px] font-bold tracking-widest text-slate-500">01 / FILE &amp; TARGET</p><h2 className="mt-1 text-lg font-semibold">Choose your limit</h2></div>
        <label className="relative grid min-h-36 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-950">
          <span className="grid justify-items-center gap-2"><ImagePlus size={25} className="text-emerald-700 dark:text-emerald-300" /><strong className="text-sm font-medium">{file ? file.name : "Drop an image or PDF here, or browse"}</strong><small className="text-xs text-slate-500">JPEG, PNG, WebP, or PDF · up to 100 MB</small></span>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => chooseFile(event.target.files?.[0])} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }} />
        </label>
        {file && <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-xs dark:bg-slate-950"><span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">{isPdf ? <FileText size={15} /> : <ImagePlus size={15} />}<span className="truncate">{file.name}</span></span><span className="shrink-0 text-slate-500">{(file.size / 1024).toFixed(1)} KB</span><button type="button" onClick={clearFile} aria-label="Remove selected file" className="grid size-6 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 dark:border-slate-700"><X size={13} /></button></div>}
        <label className="grid gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">Target size (KB)
          <input type="number" min={1} step={1} value={targetKB} onChange={(event) => setTargetKB(Number(event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <div className="grid grid-cols-4 gap-2" aria-label="Quick target sizes">
          {QUICK_TARGETS.map((size) => <button key={size} type="button" aria-pressed={targetKB === size} onClick={() => setTargetKB(size)} className={`rounded-md border px-2 py-2 text-xs transition ${targetKB === size ? "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100" : "border-slate-200 text-slate-600 hover:border-emerald-500 dark:border-slate-700 dark:text-slate-300"}`}>{size} KB</button>)}
        </div>
        <button type="button" onClick={() => void compressFile()} disabled={!file || busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{busy ? "Compressing locally…" : "Compress to target size"}</button>
        {busy && <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-900 dark:bg-emerald-950" aria-live="polite"><div className="flex items-center justify-between gap-2"><strong className="font-semibold text-emerald-900 dark:text-emerald-100">{progressLabel}</strong><span className="text-emerald-800 dark:text-emerald-200">{progress?.pagesTotal ? `${progress.pagesDone} / ${progress.pagesTotal} pages` : "In worker"}</span></div><div className="h-1.5 overflow-hidden rounded bg-emerald-100 dark:bg-emerald-900"><div className="h-full w-2/5 animate-pulse rounded bg-emerald-700 dark:bg-emerald-300" /></div></div>}
        {error && <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        {notice && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" role="status">{notice}</p>}
      </div>

      <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Compression preview">
        <div><p className="text-[10px] font-bold tracking-widest text-slate-500">02 / RESULT</p><h2 className="mt-1 text-lg font-semibold">Before and after</h2></div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <PreviewPanel title="Original" file={file} url={sourceUrl} isPdf={isPdf} sizeKB={file ? file.size / 1024 : null} />
          <PreviewPanel title="Compressed" file={file} url={resultUrl} isPdf={result?.mimeType === "application/pdf"} sizeKB={result?.finalSizeKB ?? null} />
        </div>
        {result && <div className="grid grid-cols-2 gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <div><span className="text-slate-500 dark:text-slate-400">Target</span><strong className="mt-1 block">{targetKB} KB</strong></div>
          <div><span className="text-slate-500 dark:text-slate-400">Output quality</span><strong className="mt-1 block">{(result.quality * 100).toFixed(1)}%</strong></div>
          {result.width && result.height && <div><span className="text-slate-500 dark:text-slate-400">Image dimensions</span><strong className="mt-1 block">{result.width} × {result.height}px</strong></div>}
          {result.pages && <div><span className="text-slate-500 dark:text-slate-400">PDF pages</span><strong className="mt-1 block">{result.pages}</strong></div>}
        </div>}
        <button type="button" onClick={downloadResult} disabled={!resultUrl || busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><ArrowDownToLine size={16} />Download compressed file</button>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">PDF pages are rasterized for smaller output, so text in the compressed copy will not be selectable. Images are exported as JPEG on a white background.</p>
      </section>
    </section>
  </main>;
}

function PreviewPanel({ title, file, url, isPdf, sizeKB }: { title: string; file: File | null; url: string; isPdf: boolean; sizeKB: number | null }) {
  return <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700"><strong className="text-xs font-semibold">{title}</strong><span className="text-[10px] text-slate-500">{sizeKB === null ? "— KB" : `${sizeKB.toFixed(1)} KB`}</span></div>
    <div className="relative grid aspect-[4/3] min-h-[180px] place-items-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      {!url ? <span className="grid justify-items-center gap-2 text-xs text-slate-400"><FileText size={22} /><span>{file ? "Waiting for compressed result" : "Choose a file to preview"}</span></span> : isPdf ? <iframe src={url} title={`${title} PDF preview`} className="h-full min-h-[220px] w-full bg-white" /> : <Image src={url} alt={`${title} file preview`} fill unoptimized sizes="(max-width: 640px) 100vw, 40vw" className="object-contain" />}
    </div>
    {file && url && <p className="truncate px-3 py-2 text-[10px] text-slate-500">{title === "Original" ? file.name : `${file.name.replace(/\.[^.]+$/, "")}-compressed`}</p>}
  </div>;
}