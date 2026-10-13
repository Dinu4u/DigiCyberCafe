"use client";

import { useState } from "react";
import { Download, FilePlus2, FileText, Languages, LockKeyhole } from "lucide-react";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import { createTranslatedPdf, extractPdfText, translatePdfPages, type ExtractedPdfPage } from "@/lib/pdf/pdfTranslator";

const languages = [
  ["en", "English"], ["hi", "Hindi"], ["es", "Spanish"], ["fr", "French"], ["de", "German"], ["bn", "Bengali"], ["mr", "Marathi"], ["ar", "Arabic"], ["pt", "Portuguese"], ["it", "Italian"], ["ru", "Russian"], ["ja", "Japanese"], ["zh", "Chinese"], ["ta", "Tamil"], ["te", "Telugu"],
] as const;

export function PdfTranslatorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<ArrayBuffer | null>(null);
  const [originalPages, setOriginalPages] = useState<ExtractedPdfPage[]>([]);
  const [translatedPages, setTranslatedPages] = useState<ExtractedPdfPage[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [pageIndex, setPageIndex] = useState(0);
  const [customFont, setCustomFont] = useState<ArrayBuffer | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const currentOriginal = originalPages[pageIndex];
  const currentTranslation = translatedPages[pageIndex];

  async function selectFile(selected?: File) {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    setFile(selected);
    setTranslatedPages([]);
    try {
      const buffer = await selected.arrayBuffer();
      const pages = await extractPdfText(buffer);
      setSourceBuffer(buffer);
      setOriginalPages(pages);
      setPageIndex(0);
      if (!pages.some((page) => page.text.trim())) setMessage("No selectable text was found. Scanned PDFs need OCR before translation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not extract text from this PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function translateDocument() {
    if (!originalPages.length) return setMessage("Choose a PDF with selectable text first.");
    if (!consent) return setMessage("Confirm that you want to send extracted text to the translation provider.");
    setBusy(true);
    setMessage("");
    setProgress("Starting translation...");
    try {
      const translated = await translatePdfPages(originalPages, sourceLanguage, targetLanguage, ({ pageCurrent, pageTotal }) => setProgress(`Translating page ${pageCurrent} of ${pageTotal}`));
      setTranslatedPages(translated);
      setProgress("");
      setPageIndex(0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not translate this PDF.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  async function downloadTranslated() {
    if (!sourceBuffer || !translatedPages.length) return;
    setBusy(true);
    setMessage("");
    try {
      const bytes = await createTranslatedPdf(sourceBuffer, translatedPages, targetLanguage, customFont ?? undefined);
      const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file?.name.replace(/\.pdf$/i, "") ?? "document"}-${targetLanguage}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Translated PDF downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the translated PDF.");
    } finally {
      setBusy(false);
    }
  }

  function editTranslation(text: string) {
    setTranslatedPages((current) => current.map((page, index) => index === pageIndex ? { ...page, text } : page));
  }

  return <section className="pdf-workspace">
    <div className="pdf-workspace-heading"><div><p className="eyebrow">PDF TEXT TRANSLATION</p><h1>Translate a PDF document</h1><p>Extract, translate, review, and export document text in your browser.</p></div><button className="primary-button" onClick={translatedPages.length ? downloadTranslated : translateDocument} disabled={busy || (!translatedPages.length && !originalPages.length)}><Download size={16} /> {busy ? "Working..." : translatedPages.length ? "Download translated PDF" : "Translate PDF"}</button></div>
    <div className="pdf-input-panel translator-file-panel"><label className="pdf-dropzone"><FilePlus2 size={23} /><strong>Choose a text-based PDF</strong><span>Scanned documents require OCR first</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => void selectFile(event.target.files?.[0])} /></label>{file && <div className="pdf-file-row"><FileText size={16} /><span>{file.name} · {originalPages.length} pages</span></div>}
      <div className="translator-controls"><label>From<select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><Languages size={17} /><label>To<select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{languages.filter(([code]) => code !== sourceLanguage).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div>
      <label className="font-upload-label">Unicode font for export (optional)<input type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={(event) => { const fontFile = event.target.files?.[0]; if (fontFile) void fontFile.arrayBuffer().then(setCustomFont); }} /><small>Uses script-specific Noto Sans by default; upload a TTF/OTF if the font is unavailable.</small></label>
      <label className="translation-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Send extracted text to MyMemory to translate it. The PDF file itself stays in this browser.</span></label>
      {!translatedPages.length && <button className="secondary-button translator-action" onClick={translateDocument} disabled={busy || !originalPages.length}><LockKeyhole size={15} /> Translate text</button>}
      {progress && <p className="pdf-message" aria-live="polite">{progress}</p>}{message && <p className="pdf-message" role="status">{message}</p>}
    </div>
    {originalPages.length > 0 && <><div className="translator-page-nav"><button onClick={() => setPageIndex((index) => Math.max(0, index - 1))} disabled={pageIndex === 0}>Previous page</button><span>Page {pageIndex + 1} of {originalPages.length}</span><button onClick={() => setPageIndex((index) => Math.min(originalPages.length - 1, index + 1))} disabled={pageIndex >= originalPages.length - 1}>Next page</button></div><div className="translator-columns"><section><h2>Original · {languages.find(([code]) => code === sourceLanguage)?.[1]}</h2><textarea readOnly value={currentOriginal?.text ?? ""} rows={18} /></section><section><h2>Translation · {languages.find(([code]) => code === targetLanguage)?.[1]}</h2><textarea value={currentTranslation?.text ?? ""} onChange={(event) => editTranslation(event.target.value)} rows={18} placeholder="Translate the document to edit the translated text here." /></section></div></>}
    {file && sourceBuffer && <div className="pdf-preview-grid translator-preview"><PdfThumbnail data={new Uint8Array(sourceBuffer)} label="Original PDF · page 1" /></div>}
  </section>;
}