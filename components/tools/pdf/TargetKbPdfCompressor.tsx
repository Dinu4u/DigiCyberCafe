"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FilePlus2, FileText, Gauge } from "lucide-react";

type WorkerMessage =
  | { step: "rendering" | "compressing" | "assembling"; pageCurrent: number; pageTotal: number; currentKB: number }
  | { success: true; pdfData: Uint8Array; finalSizeKB: number }
  | { success: false; error: string };

export function TargetKbPdfCompressor() {
  const workerRef = useRef<Worker | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetKB, setTargetKB] = useState(200);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Extract<WorkerMessage, { step: string }> | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => () => workerRef.current?.terminate(), []);

  function compress() {
    if (!file) return setMessage("Choose a PDF first.");
    if (!Number.isFinite(targetKB) || targetKB < 10) return setMessage("Enter a target size of at least 10 KB.");
    workerRef.current?.terminate();
    const worker = new Worker(new URL("../../../lib/workers/pdfTargetCompressor.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    setBusy(true);
    setMessage("");
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
      const url = URL.createObjectURL(new Blob([data.pdfData.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, "")}-under-${targetKB}kb.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Compressed to ${data.finalSizeKB.toFixed(1)} KB.`);
    };
    worker.onerror = () => {
      setBusy(false);
      worker.terminate();
      workerRef.current = null;
      setMessage("The compression worker stopped unexpectedly. Try another PDF.");
    };
    void file.arrayBuffer().then((pdfBuffer) => worker.postMessage({ pdfBuffer, targetKB, tolerancePercentage: 5 }, [pdfBuffer]));
  }

  const progressPercent = progress?.pageTotal ? Math.round(progress.pageCurrent / progress.pageTotal * 100) : 0;

  return <section className="pdf-workspace">
    <div className="pdf-workspace-heading"><div><p className="eyebrow">LOCAL PDF COMPRESSION</p><h1>Compress PDF to a target size</h1><p>Flattened page images are processed in a Web Worker and never uploaded.</p></div><button className="primary-button" onClick={compress} disabled={busy}><Gauge size={16} /> {busy ? "Compressing..." : "Compress PDF"}</button></div>
    <div className="pdf-workspace-grid">
      <div className="pdf-input-panel">
        <label className="pdf-dropzone"><FilePlus2 size={24} /><strong>Drop a PDF here, or browse</strong><span>Files remain on this device</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(""); }} /></label>
        {file && <div className="pdf-file-row"><FileText size={17} /><span>{file.name} · {(file.size / 1024).toFixed(1)} KB</span></div>}
        <label className="page-range-label">Maximum output size (KB)<input type="number" min={10} step={10} value={targetKB} onChange={(event) => setTargetKB(Number(event.target.value))} /></label>
        {busy && progress && <div className="pdf-progress" aria-live="polite"><div><strong>{progress.step === "rendering" ? "Rendering pages" : progress.step === "compressing" ? "Finding image quality" : "Assembling PDF"}</strong><span>{progress.pageTotal ? `Page ${progress.pageCurrent} of ${progress.pageTotal}` : "Preparing document"} · {progress.currentKB.toFixed(1)} KB</span></div><progress max={100} value={progressPercent} /></div>}
        {message && <p className="pdf-message" role="status">{message}</p>}
      </div>
      <div className="pdf-empty-preview"><FileText size={24} /><strong>Target-size export</strong><span>Pages are rasterized, so the result is smaller but no longer contains selectable text.</span><a href="/tools/pdf-compress">Use standard compression instead</a></div>
    </div>
    <div className="pdf-feature-note"><Download size={16} /> Compression runs locally; highly detailed PDFs may not fit a very small target size.</div>
  </section>;
}