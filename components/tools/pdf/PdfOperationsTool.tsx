"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FilePlus2, FileText, Layers3, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { mergePdfFiles, splitPdf } from "@/lib/pdf/pdfOperations";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";

type OperationMode = "merge" | "split";
type PdfEntry = { file: File; buffer: ArrayBuffer; pages: number };

export function PdfOperationsTool({ mode }: { mode: OperationMode }) {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitResults, setSplitResults] = useState<Record<string, Uint8Array> | null>(null);
  const [busy, setBusy] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const isMerge = mode === "merge";
  const pageCount = entries[0]?.pages ?? 0;

  async function addFiles(selected: FileList | null) {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const next = await Promise.all(Array.from(selected).map(async (file) => {
        const buffer = await file.arrayBuffer();
        const document = await PDFDocument.load(buffer);
        return { file, buffer, pages: document.getPageCount() };
      }));
      const accepted = isMerge ? next : next.slice(0, 1);
      setEntries((current) => isMerge ? [...current, ...accepted] : accepted);
      setSplitResults(null);
      if (!isMerge && accepted[0]) {
        setSelectedPages(Array.from({ length: accepted[0].pages }, (_, index) => index + 1));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read this PDF.");
    } finally {
      setBusy(false);
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
    if (!isMerge && !selectedPages.length) return setMessage("Select at least one page to split.");
    setBusy(true);
    setMessage("");
    try {
      if (isMerge) {
        const bytes = await mergePdfFiles(entries.map((entry) => entry.buffer));
        const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "merged-pdf.pdf";
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(`merged-pdf.pdf is ready (${(bytes.byteLength / 1024).toFixed(1)} KB).`);
      } else {
        const results = await splitPdf(entries[0].buffer, selectedPages.join(","));
        setSplitResults(results);
        setMessage(`${Object.keys(results).length} separate PDF page${Object.keys(results).length === 1 ? "" : "s"} ready to review.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not ${mode} the PDF files.`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadSplitPages() {
    if (!splitResults) return;
    setBusy(true);
    setMessage("");
    try {
      const resultEntries = Object.entries(splitResults);
      let filename: string;
      let bytes: Uint8Array;
      let mimeType: string;
      if (resultEntries.length === 1) {
        [filename, bytes] = resultEntries[0];
        mimeType = "application/pdf";
      } else {
        const archive = new JSZip();
        resultEntries.forEach(([name, pageBytes]) => archive.file(name, pageBytes));
        bytes = await archive.generateAsync({ type: "uint8array" });
        filename = "split-pdf-pages.zip";
        mimeType = "application/zip";
      }
      const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`${filename} downloaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not download the split pages.");
    } finally {
      setBusy(false);
    }
  }

  function togglePage(pageNumber: number) {
    setSelectedPages((current) => current.includes(pageNumber)
      ? current.filter((page) => page !== pageNumber)
      : [...current, pageNumber].sort((first, second) => first - second));
    setSplitResults(null);
    setMessage("");
  }

  const sourceEntry = entries[0];

  return (
    <section className="pdf-workspace">
      <div className="pdf-workspace-heading">
        <div>
          <p className="eyebrow">PRIVATE IN-BROWSER PDF TOOL</p>
          <h1>{isMerge ? "Merge PDF files" : "Split PDF pages"}</h1>
          <p>{isMerge ? "Combine multiple PDF files online in the order you choose." : "Preview every page, select the pages you want, then create separate PDFs."}</p>
        </div>
      </div>
      <div className="pdf-workspace-grid">
        <div className="pdf-input-panel">
          <label className="pdf-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            event.preventDefault();
            void addFiles(event.dataTransfer.files);
          }}>
            <FilePlus2 size={24} />
            <strong>Drop {isMerge ? "PDF files" : "a PDF"} here, or browse</strong>
            <span>Files stay on this device</span>
            <input type="file" accept="application/pdf,.pdf" multiple={isMerge} disabled={busy} onChange={(event) => void addFiles(event.target.files)} />
          </label>
          {entries.length > 0 && (
            <div className="pdf-file-list">
              {entries.map((entry, index) => (
                <div className="pdf-file-row" key={`${entry.file.name}-${index}`} draggable={isMerge} onDragStart={() => setDraggingIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
                  if (draggingIndex !== null) moveEntry(draggingIndex, index);
                  setDraggingIndex(null);
                }}>
                  <FileText size={17} />
                  <span>{entry.file.name} · {entry.pages} pages</span>
                  {isMerge && <>
                    <button onClick={() => moveEntry(index, index - 1)} aria-label={`Move ${entry.file.name} up`}><ArrowUp size={14} /></button>
                    <button onClick={() => moveEntry(index, index + 1)} aria-label={`Move ${entry.file.name} down`}><ArrowDown size={14} /></button>
                  </>}
                  <button onClick={() => {
                    setEntries((current) => current.filter((_, entryIndex) => entryIndex !== index));
                    setSelectedPages([]);
                    setSplitResults(null);
                  }} aria-label={`Remove ${entry.file.name}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {!isMerge && pageCount > 0 && !splitResults && (
            <div className="page-selection-controls">
              <strong>{selectedPages.length} of {pageCount} pages selected</strong>
              <button className="text-button" onClick={() => setSelectedPages(selectedPages.length === pageCount ? [] : Array.from({ length: pageCount }, (_, index) => index + 1))}>
                {selectedPages.length === pageCount ? "Deselect all" : "Select all"}
              </button>
            </div>
          )}
          {message && <p className="pdf-message" role="status">{message}</p>}
          <div className="pdf-action-row">
            {!splitResults ? (
              <button className="primary-button" onClick={() => void runOperation()} disabled={busy || !entries.length || (!isMerge && !selectedPages.length) || (isMerge && entries.length < 2)}>
                {isMerge ? <Layers3 size={16} /> : <FileText size={16} />}
                {busy ? "Working..." : isMerge ? "Merge PDFs" : "Create selected pages"}
              </button>
            ) : (
              <button className="primary-button" onClick={() => void downloadSplitPages()} disabled={busy}>
                <Download size={16} /> {busy ? "Preparing download..." : splitResults && Object.keys(splitResults).length > 1 ? "Download pages as ZIP" : "Download page PDF"}
              </button>
            )}
          </div>
        </div>
        {isMerge ? (
          entries.length
            ? <div className="pdf-preview-grid">{entries.map((entry, index) => <PdfThumbnail key={`${entry.file.name}-${index}`} data={new Uint8Array(entry.buffer)} label={`${entry.file.name} · page 1 of ${entry.pages}`} />)}</div>
            : <div className="pdf-empty-preview"><Layers3 size={22} /><strong>PDF thumbnails appear here</strong><span>Choose source files to preview their first pages.</span></div>
        ) : splitResults ? (
          <div className="pdf-preview-grid split-page-previews">
            {Object.entries(splitResults).map(([filename, bytes]) => (
              <PdfThumbnail key={filename} data={bytes} label={filename} />
            ))}
          </div>
        ) : sourceEntry ? (
          <div className="pdf-preview-grid split-page-previews">
            {Array.from({ length: sourceEntry.pages }, (_, index) => {
              const pageNumber = index + 1;
              const selected = selectedPages.includes(pageNumber);
              return (
                <label className={`split-page-option${selected ? " selected" : ""}`} key={pageNumber}>
                  <input type="checkbox" checked={selected} disabled={busy} onChange={() => togglePage(pageNumber)} />
                  <PdfThumbnail data={new Uint8Array(sourceEntry.buffer)} pageNumber={pageNumber} label={`Page ${pageNumber}`} />
                </label>
              );
            })}
          </div>
        ) : (
          <div className="pdf-empty-preview"><Layers3 size={22} /><strong>Page previews appear here</strong><span>Choose a PDF to preview and select its pages.</span></div>
        )}
      </div>
    </section>
  );
}
