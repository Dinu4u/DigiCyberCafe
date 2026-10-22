"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FilePlus2, FileText, Gauge } from "lucide-react";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import { getLocalProcessingSupportIssue } from "@/lib/utils/browserRuntimeSupport";

type WorkerMessage =
  | { step: "rendering" | "compressing" | "assembling"; pageCurrent: number; pageTotal: number; currentKB: number }
  | { success: true; pdfData: Uint8Array; finalSizeKB: number }
  | { success: false; error: string };

export function TargetKbPdfCompressor() {
  const workerRef = useRef<Worker | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<Uint8Array | null>(null);
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  const [targetKB, setTargetKB] = useState(200);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Extract<WorkerMessage, { step: string }> | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => () => workerRef.current?.terminate(), []);

  async function selectFile(selected?: File) {
    if (!selected) return;
    workerRef.current?.terminate();
    workerRef.current = null;
    setFile(selected);
    setSourceData(null);
    setCompressedData(null);
    setMessage("");
    setProgress(null);
    try {
      setSourceData(new Uint8Array(await selected.arrayBuffer()));
    } catch (error) {
      setFile(null);
      setMessage(error instanceof Error ? error.message : "Could not read this PDF.");
    }
  }

  function compress() {
    if (!file) return setMessage("Choose a PDF first.");
    if (!Number.isFinite(targetKB) || targetKB < 10) return setMessage("Enter a target size of at least 10 KB.");
    const runtimeIssue = getLocalProcessingSupportIssue({ requireWorker: true, requireOffscreenCanvas: true });
    if (runtimeIssue) return setMessage(`This browser cannot run the local PDF processor. ${runtimeIssue}`);
    workerRef.current?.terminate();
    let worker: Worker;
    try {
      worker = new Worker(new URL("../../../lib/workers/pdfTargetCompressor.worker.ts", import.meta.url), { type: "module" });
    } catch {
      return setMessage("The PDF compression worker could not start. Check browser restrictions or try another browser.");
    }
    workerRef.current = worker;
    setBusy(true);
    setMessage("");
    setCompressedData(null);
    setProgress({ step: "rendering", pageCurrent: 0, pageTotal: 0, currentKB: 0 });
    worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if ("step" in data) {
        setProgress(data);
        return;
      }
      setBusy(false);
      worker.terminate();
      workerRef.current = null;
      if (!data.success) {
        setMessage(data.error);
        return;
      }
      setCompressedData(data.pdfData);
      setMessage(`Compressed PDF is ready at ${data.finalSizeKB.toFixed(1)} KB. Review it below before downloading.`);
    };
    worker.onerror = () => {
      setBusy(false);
      worker.terminate();
      workerRef.current = null;
      setMessage("The compression worker stopped unexpectedly. Try another PDF.");
    };
    void file.arrayBuffer().then((pdfBuffer) => worker.postMessage({ pdfBuffer, targetKB, tolerancePercentage: 5 }, [pdfBuffer])).catch((error: unknown) => {
      setBusy(false);
      worker.terminate();
      workerRef.current = null;
      setMessage(error instanceof Error ? error.message : "Could not read this PDF for compression.");
    });
  }

  function downloadCompressed() {
    if (!file || !compressedData) return;
    const url = URL.createObjectURL(new Blob([compressedData.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name.replace(/\.pdf$/i, "")}-under-${targetKB}kb.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const progressPercent = progress?.pageTotal ? Math.round(progress.pageCurrent / progress.pageTotal * 100) : 0;
  const originalKB = file ? file.size / 1024 : 0;
  const compressedKB = compressedData ? compressedData.byteLength / 1024 : 0;
  const reduction = originalKB > 0 && compressedData
    ? ((originalKB - compressedKB) / originalKB) * 100
    : null;

  return (
    <section className="pdf-workspace">
      <div className="pdf-workspace-heading">
        <div>
          <p className="eyebrow">LOCAL PDF COMPRESSION</p>
          <h1>Compress PDF to a target size</h1>
          <p>Choose an output size, compress locally, compare the result, then download when ready.</p>
        </div>
      </div>
      <div className="pdf-input-panel target-compression-panel">
        <label className="pdf-dropzone">
          <FilePlus2 size={24} />
          <strong>Drop a PDF here, or browse</strong>
          <span>Files remain on this device</span>
          <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => void selectFile(event.target.files?.[0])} />
        </label>
        {file && <div className="pdf-file-row"><FileText size={17} /><span>{file.name} · Original size: {originalKB.toFixed(1)} KB</span></div>}
        <label className="page-range-label">
          Maximum output size (KB)
          <input type="number" min={10} step={10} value={targetKB} disabled={busy} onChange={(event) => {
            setTargetKB(Number(event.target.value));
            setCompressedData(null);
            setMessage("");
          }} />
        </label>
        {busy && progress && (
          <div className="pdf-progress" aria-live="polite">
            <div>
              <strong>{progress.step === "rendering" ? "Rendering pages" : progress.step === "compressing" ? "Finding image quality" : "Assembling PDF"}</strong>
              <span>{progress.pageTotal ? `Page ${progress.pageCurrent} of ${progress.pageTotal}` : "Preparing document"} · {progress.currentKB.toFixed(1)} KB</span>
            </div>
            <progress max={100} value={progressPercent} />
          </div>
        )}
        {message && <p className="pdf-message" role="status">{message}</p>}
        <div className="pdf-action-row">
          <button className="primary-button" onClick={compress} disabled={busy || !file}>
            <Gauge size={16} /> {busy ? "Compressing..." : `Compress PDF to ${targetKB} KB`}
          </button>
          {compressedData && <button className="secondary-button" onClick={downloadCompressed} disabled={busy}><Download size={16} /> Download compressed PDF</button>}
        </div>
      </div>
      {sourceData && (
        <div className="compression-comparison">
          <section className="compression-preview-card">
            <h2>Before · Original PDF</h2>
            <PdfThumbnail data={sourceData} label={`${file?.name ?? "Original PDF"} · page 1`} />
            <p>Original size: <strong>{originalKB.toFixed(1)} KB</strong></p>
          </section>
          {compressedData ? (
            <section className="compression-preview-card">
              <h2>After · Target-size PDF</h2>
              <PdfThumbnail data={compressedData} label="Compressed PDF · page 1" />
              <p>Compressed size: <strong>{compressedKB.toFixed(1)} KB</strong></p>
              {reduction !== null && <p>{reduction >= 0 ? "Size reduced by" : "Size increased by"}: <strong>{Math.abs(reduction).toFixed(1)}%</strong></p>}
            </section>
          ) : (
            <div className="pdf-empty-preview compression-pending-preview"><FileText size={24} /><strong>Compressed preview will appear here</strong><span>Compress the PDF to compare it with the original.</span></div>
          )}
        </div>
      )}
      <div className="pdf-feature-note"><Download size={16} /> Compression runs locally; pages are rasterized, so the result is smaller but no longer contains selectable text.</div>
    </section>
  );
}
