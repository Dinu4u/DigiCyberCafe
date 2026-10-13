"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Download, FilePlus2, FileText, Image as ImageIcon, RotateCcw } from "lucide-react";
import { convertImagesToPdf, convertOfficeToPdf, convertTextToPdf } from "@/lib/pdf/pdfOperations";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import { useMonetizedAction } from "@/lib/hooks/useMonetizedAction";

type ConverterMode = "image" | "office" | "text";
const copy = {
  image: { title: "Convert images to PDF", description: "Convert JPG to PDF free, or place PNG and WebP images into print-ready pages.", accept: "image/jpeg,image/png,image/webp", button: "Create image PDF" },
  office: { title: "Convert Word and Excel to PDF", description: "Convert DOCX, XLSX, and XLS files to PDF locally in your browser.", accept: ".docx,.xlsx,.xls,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", button: "Convert document" },
  text: { title: "Convert text to PDF", description: "Convert TXT files to a paginated, print-ready PDF with page numbers.", accept: ".txt,text/plain", button: "Create text PDF" },
};

export function PdfConverterTool({ mode }: { mode: ConverterMode }) {
  const runMonetizedAction = useMonetizedAction();
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(11);
  const [layout, setLayout] = useState<"fit-page" | "a4-margin">("a4-margin");
  const [previewData, setPreviewData] = useState<Uint8Array | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const config = copy[mode];

  async function addFiles(selected: FileList | null) {
    if (!selected) return;
    const nextFiles = Array.from(selected);
    setFiles((current) => mode === "image" ? [...current, ...nextFiles] : nextFiles.slice(0, 1));
    if (mode === "text" && nextFiles[0]) setText(await nextFiles[0].text());
    setPreviewData(null);
    setMessage("");
  }

  function moveImage(from: number, to: number) {
    setFiles((current) => {
      if (to < 0 || to >= current.length) return current;
      const reordered = [...current];
      const [item] = reordered.splice(from, 1);
      reordered.splice(to, 0, item);
      return reordered;
    });
  }

  async function createPdf() {
    if (mode !== "text" && !files.length) return setMessage("Choose a file first.");
    if (mode === "text" && !text.trim()) return setMessage("Add some text or choose a TXT file first.");
    setBusy(true);
    setMessage("");
    try {
      const bytes = mode === "image"
        ? await convertImagesToPdf(files, layout)
        : mode === "office"
          ? await convertOfficeToPdf(files[0])
          : await convertTextToPdf(text, fontSize);
      setPreviewData(bytes);
      runMonetizedAction(() => downloadPdf(bytes, `${files[0]?.name.replace(/\.[^.]+$/, "") ?? mode}-eCyberCafe.pdf`));
      setMessage("PDF created and downloaded. The first page preview is ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="pdf-workspace">
    <div className="pdf-workspace-heading"><div><p className="eyebrow">PRIVATE IN-BROWSER CONVERTER</p><h1>{config.title}</h1><p>{config.description}</p></div><button className="primary-button" onClick={createPdf} disabled={busy}><Download size={16} /> {busy ? "Converting..." : config.button}</button></div>
    <div className="pdf-workspace-grid">
      <div className="pdf-input-panel">
        <label className="pdf-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files); }}><FilePlus2 size={24} /><strong>Drop {mode === "image" ? "images" : "a file"} here, or browse</strong><span>{mode === "image" ? "JPG, JPEG, PNG, or WebP" : mode === "office" ? "DOCX, XLSX, or XLS" : "TXT files are read locally"}</span><input type="file" accept={config.accept} multiple={mode === "image"} onChange={(event) => void addFiles(event.target.files)} /></label>
        {mode === "image" && <label className="page-range-label">Page layout<select value={layout} onChange={(event) => setLayout(event.target.value as typeof layout)}><option value="a4-margin">A4 with margins</option><option value="fit-page">Fit page to image</option></select></label>}
        {mode === "text" && <><label className="page-range-label">Font size<select value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}>{[9, 10, 11, 12, 14, 16].map((size) => <option key={size} value={size}>{size} pt</option>)}</select></label><label className="page-range-label">Text content<textarea className="conversion-textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste text or load a .txt file" rows={10} /></label></>}
        {files.length > 0 && <div className="pdf-file-list">{files.map((file, index) => <div className="pdf-file-row" key={`${file.name}-${index}`} draggable={mode === "image"} onDragStart={() => setDraggingIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggingIndex !== null) moveImage(draggingIndex, index); setDraggingIndex(null); }}><FileText size={17} /><span>{file.name}</span>{mode === "image" && <><button onClick={() => moveImage(index, index - 1)} aria-label={`Move ${file.name} up`}><ArrowUp size={14} /></button><button onClick={() => moveImage(index, index + 1)} aria-label={`Move ${file.name} down`}><ArrowDown size={14} /></button></>}<button onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><RotateCcw size={14} /></button></div>)}</div>}
        {message && <p className="pdf-message" role="status">{message}</p>}
      </div>
      {previewData ? <div className="pdf-preview-grid"><PdfThumbnail data={previewData} label="Generated PDF · page 1" /></div> : mode === "image" && files.length ? <div className="pdf-preview-grid">{files.map((file, index) => <ImagePreview key={`${file.name}-${index}`} file={file} index={index} />)}</div> : <div className="pdf-empty-preview"><ImageIcon size={22} /><strong>Your preview will appear here</strong><span>Convert a document to generate a PDF thumbnail.</span></div>}
    </div>
  </section>;
}

function ImagePreview({ file, index }: { file: File; index: number }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <div className="pdf-page-card"><Image src={url} alt={`Image ${index + 1}: ${file.name}`} width={170} height={220} unoptimized /><span>{index + 1}. {file.name}</span></div>;
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}