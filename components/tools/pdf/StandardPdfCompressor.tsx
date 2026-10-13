"use client";

import { useState } from "react";
import { Download, FilePlus2, FileText, Minimize2 } from "lucide-react";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import { compressPdfFile } from "@/lib/pdf-tools";

export function StandardPdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<Uint8Array | null>(null);
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function selectFile(selected?: File) {
    if (!selected) return;
    setBusy(true);
    setFile(selected);
    setSourceData(null);
    setCompressedData(null);
    setMessage("");
    try {
      setSourceData(new Uint8Array(await selected.arrayBuffer()));
    } catch (error) {
      setFile(null);
      setMessage(error instanceof Error ? error.message : "Could not read this PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function compress() {
    if (!file) return setMessage("Choose a PDF first.");
    setBusy(true);
    setCompressedData(null);
    setMessage("");
    try {
      const output = await compressPdfFile(file);
      setCompressedData(new Uint8Array(await output.arrayBuffer()));
      setMessage("Compression is complete. Compare the original and compressed previews before downloading.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not compress this PDF.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCompressed() {
    if (!file || !compressedData) return;
    const url = URL.createObjectURL(new Blob([compressedData.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const originalKB = file ? file.size / 1024 : 0;
  const compressedKB = compressedData ? compressedData.byteLength / 1024 : 0;
  const reduction = originalKB > 0 && compressedData
    ? ((originalKB - compressedKB) / originalKB) * 100
    : null;

  return (
    <section className="pdf-workspace">
      <div className="pdf-workspace-heading">
        <div>
          <p className="eyebrow">LOCAL PDF OPTIMIZATION</p>
          <h1>Standard PDF compression</h1>
          <p>Optimize a PDF without rasterizing its pages, then compare sizes and previews before downloading.</p>
        </div>
      </div>
      <div className="pdf-input-panel target-compression-panel">
        <label className="pdf-dropzone">
          <FilePlus2 size={24} />
          <strong>Drop a PDF here, or browse</strong>
          <span>Files stay on this device</span>
          <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => void selectFile(event.target.files?.[0])} />
        </label>
        {file && <div className="pdf-file-row"><FileText size={17} /><span>{file.name} · Original size: {originalKB.toFixed(1)} KB</span></div>}
        {message && <p className="pdf-message" role="status">{message}</p>}
        <div className="pdf-action-row">
          <button className="primary-button" onClick={() => void compress()} disabled={busy || !file}>
            <Minimize2 size={16} /> {busy ? "Compressing..." : "Compress PDF"}
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
              <h2>After · Standard compression</h2>
              <PdfThumbnail data={compressedData} label="Compressed PDF · page 1" />
              <p>Compressed size: <strong>{compressedKB.toFixed(1)} KB</strong></p>
              {reduction !== null && <p>{reduction >= 0 ? "Size reduced by" : "Size increased by"}: <strong>{Math.abs(reduction).toFixed(1)}%</strong></p>}
            </section>
          ) : (
            <div className="pdf-empty-preview compression-pending-preview"><FileText size={24} /><strong>Compressed preview will appear here</strong><span>Compress the PDF to compare it with the original.</span></div>
          )}
        </div>
      )}
      <div className="pdf-feature-note"><FileText size={16} /> Standard compression preserves selectable page content where possible. For a smaller rasterized file, use the target-size compressor.</div>
    </section>
  );
}
