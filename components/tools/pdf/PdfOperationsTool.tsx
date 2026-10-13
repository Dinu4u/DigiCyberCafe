"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FilePlus2, FileText, Layers3, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { mergePdfFiles, splitPdf } from "@/lib/pdf/pdfOperations";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";

type OperationMode = "merge" | "split";
type PdfEntry = { file: File; buffer: ArrayBuffer; pages: number };

export function PdfOperationsTool({ mode }: { mode: OperationMode }) {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [pageRanges, setPageRanges] = useState("1-3");
  const [preview, setPreview] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const isMerge = mode === "merge";
  const pageCount = entries[0]?.pages ?? 0;

  async function addFiles(selected: FileList | null) {
    if (!selected) return;
    try {
      const next = await Promise.all(Array.from(selected).map(async (file) => {
        const buffer = await file.arrayBuffer();
        const document = await PDFDocument.load(buffer);
        return { file, buffer, pages: document.getPageCount() };
      }));
      setEntries((current) => isMerge ? [...current, ...next] : next.slice(0, 1));
      setPreview(null);
      setMessage("");
      if (!isMerge && next[0]) setPageRanges(next[0].pages === 1 ? "1" : `1-${Math.min(3, next[0].pages)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read this PDF.");
    }
  }

  function moveEntry(from: number, to: number) {
    setEntries((current) => {
      if (to < 0 || to >= current.length) return current;
      const reordered = [...current];
      const [entry] = reordered.splice(from, 1);
      reordered.splice(to, 0, entry);
      return reordered;
    });
  }

  async function runOperation() {
    if (!entries.length) return setMessage("Choose a PDF first.");
    if (isMerge && entries.length < 2) return setMessage("Choose at least two PDFs to merge.");
    setBusy(true);
    setMessage("");
    try {
      const results = isMerge
        ? { "merged-pdf.pdf": await mergePdfFiles(entries.map((entry) => entry.buffer)) }
        : await splitPdf(entries[0].buffer, pageRanges);
      const [filename, bytes] = Object.entries(results)[0];
      setPreview(filename.endsWith(".pdf") ? bytes : null);
      const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: filename.endsWith(".zip") ? "application/zip" : "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`${filename} is ready (${(bytes.byteLength / 1024).toFixed(1)} KB).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not ${mode} the PDF files.`);
    } finally {
      setBusy(false);
    }
  }

  return <section className="pdf-workspace">
    <div className="pdf-workspace-heading"><div><p className="eyebrow">PRIVATE IN-BROWSER PDF TOOL</p><h1>{isMerge ? "Merge PDF files" : "Split PDF pages"}</h1><p>{isMerge ? "Combine multiple PDF files online in the order you choose." : "Extract pages from a PDF or split it into individual pages."}</p></div><button className="primary-button" onClick={runOperation} disabled={busy}><Download size={16} /> {busy ? "Working..." : isMerge ? "Merge PDFs" : "Split PDF"}</button></div>
    <div className="pdf-workspace-grid">
      <div className="pdf-input-panel"><label className="pdf-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files); }}><FilePlus2 size={24} /><strong>Drop {isMerge ? "PDF files" : "a PDF"} here, or browse</strong><span>Files stay on this device</span><input type="file" accept="application/pdf,.pdf" multiple={isMerge} onChange={(event) => void addFiles(event.target.files)} /></label>
        {entries.length > 0 && <div className="pdf-file-list">{entries.map((entry, index) => <div className="pdf-file-row" key={`${entry.file.name}-${index}`} draggable={isMerge} onDragStart={() => setDraggingIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggingIndex !== null) moveEntry(draggingIndex, index); setDraggingIndex(null); }}><FileText size={17} /><span>{entry.file.name} · {entry.pages} pages</span>{isMerge && <><button onClick={() => moveEntry(index, index - 1)} aria-label={`Move ${entry.file.name} up`}><ArrowUp size={14} /></button><button onClick={() => moveEntry(index, index + 1)} aria-label={`Move ${entry.file.name} down`}><ArrowDown size={14} /></button></>}<button onClick={() => setEntries((current) => current.filter((_, entryIndex) => entryIndex !== index))} aria-label={`Remove ${entry.file.name}`}><Trash2 size={14} /></button></div>)}</div>}
        {!isMerge && pageCount > 0 && <label className="page-range-label">Pages or ranges<input value={pageRanges} onChange={(event) => setPageRanges(event.target.value)} placeholder={`1-3, 5 (1-${pageCount})`} /><small>Use “all” to export every page separately as a ZIP.</small></label>}
        {message && <p className="pdf-message" role="status">{message}</p>}
      </div>
      {preview ? <div className="pdf-preview-grid"><PdfThumbnail data={preview} label="Generated PDF · page 1" /></div> : entries.length ? <div className="pdf-preview-grid">{(isMerge ? entries : entries.slice(0, 1)).map((entry, index) => <PdfThumbnail key={`${entry.file.name}-${index}`} data={new Uint8Array(entry.buffer)} label={`${entry.file.name} · ${entry.pages} pages`} />)}</div> : <div className="pdf-empty-preview"><Layers3 size={22} /><strong>PDF thumbnails appear here</strong><span>Choose source files to preview their first pages.</span></div>}
    </div>
  </section>;
}