"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, FileVideo2, LoaderCircle, ShieldCheck, Upload, X } from "lucide-react";
import {
  MAX_VIDEO_FILE_BYTES,
  type VideoCompressorProgress,
  type VideoCompressorWorkerResponse,
} from "@/types/videoCompressor";
import { VideoMetricsCard } from "@/components/tools/video/VideoMetricsCard";
import { getLocalProcessingSupportIssue } from "@/lib/utils/browserRuntimeSupport";

type CompressionState = "idle" | "processing" | "complete" | "error";

const VIDEO_SIZE_LIMIT_ERROR =
  "Your uploaded video exceeds the 120 MB limit. For your privacy, we process videos on your device and do not upload them to the internet. Please choose a video smaller than 120 MB.";
const VIDEO_WORKER_ERROR =
  "The video worker stopped unexpectedly. Try again with a smaller video or try uploading another video.";

export function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<CompressionState>("idle");
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState<VideoCompressorProgress | null>(null);
  const [error, setError] = useState("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const outputUrlRef = useRef<string | null>(null);
  const busy = state === "processing";

  useEffect(() => {
    return () => {
      const worker = workerRef.current;
      if (worker) {
        worker.onmessage = ({ data }: MessageEvent<VideoCompressorWorkerResponse>) => {
          if (data.type === "cancelled") worker.terminate();
        };
        worker.onerror = () => worker.terminate();
        worker.onmessageerror = () => worker.terminate();
        worker.postMessage({ type: "cancel" });
      }
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, []);

  function clearOutputUrl() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = null;
    setOutputUrl(null);
    setOutputBlob(null);
  }

  function cancelCompression() {
    const worker = workerRef.current;
    if (!worker || cancelling) return;
    setCancelling(true);
    worker.postMessage({ type: "cancel" });
    setProgress({ phase: "preparing", progress: 0, message: "Cancelling and releasing browser memory…" });
  }

  function handleCancelled(worker: Worker) {
    if (workerRef.current !== worker) return;
    worker.terminate();
    workerRef.current = null;
    setCancelling(false);
    setState("idle");
    setProgress(null);
    setError("Compression was cancelled.");
  }

  function chooseFile(selected: File | undefined) {
    if (!selected) return;
    if (selected.size > MAX_VIDEO_FILE_BYTES) {
      setError(VIDEO_SIZE_LIMIT_ERROR);
      return;
    }
    if (selected.size === 0) {
      setError("This video file is empty. Choose another file.");
      return;
    }
    if (!selected.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv|3gp|ogv)$/i.test(selected.name)) {
      setError("Choose a supported video file, such as MP4, MOV, WebM, MKV, or AVI.");
      return;
    }

    workerRef.current?.terminate();
    workerRef.current = null;
    setCancelling(false);
    clearOutputUrl();
    setFile(selected);
    setState("idle");
    setProgress(null);
    setError("");
  }

  function startCompression() {
    if (!file || busy) return;
    const runtimeIssue = getLocalProcessingSupportIssue({
      requireWorker: true,
      requireWebAssembly: true,
    });
    if (runtimeIssue) {
      setState("error");
      setError(`This browser cannot run the local video engine. ${runtimeIssue}`);
      setProgress(null);
      return;
    }
    setState("processing");
    setProgress({ phase: "loading", progress: 0, message: "Starting the local video worker…" });
    setError("");
    setCancelling(false);
    clearOutputUrl();

    let worker: Worker;
    try {
      worker = new Worker(new URL("../../../lib/workers/videoCompressor.worker.ts", import.meta.url));
    } catch {
      setState("error");
      setError(VIDEO_WORKER_ERROR);
      setProgress(null);
      return;
    }

    workerRef.current = worker;
    worker.onmessage = ({ data }: MessageEvent<VideoCompressorWorkerResponse>) => {
      if (workerRef.current !== worker) return;
      if (data.type === "cancelled") {
        handleCancelled(worker);
        return;
      }
      if (data.type === "progress") {
        setProgress(data.progress);
        return;
      }
      worker.terminate();
      workerRef.current = null;
      setProgress(null);
      if (data.type === "failure") {
        setState("error");
        setError(data.message);
        return;
      }
      const blob = new Blob([data.output], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutputUrl(url);
      setOutputBlob(blob);
      setState("complete");
    };
    worker.onerror = () => {
      if (workerRef.current !== worker) return;
      worker.terminate();
      workerRef.current = null;
      setCancelling(false);
      setProgress(null);
      setState("error");
      setError(VIDEO_WORKER_ERROR);
    };
    worker.onmessageerror = () => {
      if (workerRef.current !== worker) return;
      worker.terminate();
      workerRef.current = null;
      setCancelling(false);
      setProgress(null);
      setState("error");
      setError(VIDEO_WORKER_ERROR);
    };
    worker.postMessage({ type: "compress", file });
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!busy) chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6" aria-labelledby="video-compressor-title">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Private, in-browser video processing</p>
          <h1 id="video-compressor-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Smart Video Compressor
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Compress a video with FFmpeg.wasm, check its new file size and percentage change, then download the MP4. Your video is processed on this device and is not uploaded.
          </p>
        </div>

        <label
          className={`mt-7 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition ${
            busy ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70" : "border-slate-300 bg-slate-50 hover:border-emerald-600 hover:bg-emerald-50/40"
          }`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={26} className="text-emerald-700" aria-hidden="true" />
          <strong className="mt-3 text-base text-slate-900">{file ? "Choose a different video" : "Drop a video here or browse"}</strong>
          <span className="mt-1 text-sm text-slate-600">
            MP4, MOV, WebM, MKV, AVI and more · Maximum size 120 MB
          </span>
          {file && <span className="mt-2 max-w-full truncate text-sm font-medium text-slate-800">{file.name} · {formatBytes(file.size)}</span>}
          <input
            className="sr-only"
            type="file"
            accept="video/*,.mkv,.avi,.mov,.wmv,.flv,.3gp,.ogv"
            disabled={busy}
            onChange={(event) => {
              chooseFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
            aria-label="Choose a video to compress"
          />
        </label>

        {error && (
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startCompression}
            disabled={!file || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <FileVideo2 size={17} aria-hidden="true" />}
            {busy ? "Compressing…" : "Compress video"}
          </button>
          {busy && (
            <button
              type="button"
              onClick={cancelCompression}
              disabled={cancelling}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <X size={16} aria-hidden="true" /> {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={15} aria-hidden="true" /> Video stays on your device
          </p>
        </div>

        {progress && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4" role="status" aria-live="polite">
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-medium text-slate-800">{progress.message}</span>
              {progress.phase === "compressing" && <span className="shrink-0 text-slate-600">{progress.progress}%</span>}
            </div>
            <progress className="mt-3 h-2 w-full accent-emerald-700" max={100} value={progress.phase === "compressing" ? progress.progress : undefined} aria-label="Video compression progress" />
          </div>
        )}

      </div>

      {file && outputBlob && outputUrl && (
        <VideoMetricsCard
          originalName={file.name}
          originalBytes={file.size}
          compressedBytes={outputBlob.size}
          downloadUrl={outputUrl}
        />
      )}
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  if (value >= 1024) {
    value /= 1024;
    unitIndex = 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
