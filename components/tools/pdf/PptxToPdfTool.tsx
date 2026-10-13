"use client";

import { useEffect, useRef, useState } from "react";
import type { init as initPptxPreview } from "pptx-preview";
import { Download, FilePlus2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import styles from "./PptxToPdfTool.module.css";

type PptxPreviewer = ReturnType<typeof initPptxPreview>;

export function PptxToPdfTool() {
  const hostRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<PptxPreviewer | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [output, setOutput] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!buffer || !hostRef.current) return;
    const host = hostRef.current;
    let active = true;
    let previewer: PptxPreviewer | null = null;
    setSlideCount(0);
    setSlideIndex(0);
    setOutput(null);
    setMessage("");
    void (async () => {
      try {
        const { init } = await import("pptx-preview");
        if (!active) return;
        previewer = init(host, { width: 960, height: 600, mode: "slide" });
        previewerRef.current = previewer;
        await previewer.load(buffer.slice(0));
        if (!active) return;
        if (!previewer.slideCount) throw new Error("No slides were found in this presentation.");
        previewer.renderSingleSlide(0);
        setSlideCount(previewer.slideCount);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not open this PowerPoint file.");
      }
    })();
    return () => {
      active = false;
      previewer?.destroy();
      if (previewerRef.current === previewer) previewerRef.current = null;
      host.replaceChildren();
    };
  }, [buffer]);

  useEffect(() => {
    if (!busy && slideCount && previewerRef.current) previewerRef.current.renderSingleSlide(slideIndex);
  }, [busy, slideIndex, slideCount]);

  async function selectFile(selected?: File) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pptx")) {
      setMessage("Choose a .pptx presentation. Legacy .ppt files are not supported.");
      return;
    }
    setFile(selected);
    setMessage("Loading presentation locally...");
    setBuffer(await selected.arrayBuffer());
  }

  async function convertToPdf() {
    const previewer = previewerRef.current;
    const host = hostRef.current;
    if (!previewer || !host || !slideCount) return setMessage("Choose a valid PPTX file first.");
    setBusy(true);
    setOutput(null);
    setMessage("");
    try {
      const pdf = await PDFDocument.create();
      for (let index = 0; index < slideCount; index += 1) {
        setSlideIndex(index);
        previewer.renderSingleSlide(index);
        await nextFrame();
        await nextFrame();
        await document.fonts.ready;
        const slide = host.querySelector<HTMLElement>(`.pptx-preview-slide-wrapper-${index}`);
        if (!slide) throw new Error(`Could not render slide ${index + 1}.`);
        setProgress(`Rendering slide ${index + 1} of ${slideCount}`);
        const canvas = await html2canvas(slide, { scale: 1.5, backgroundColor: "#ffffff", useCORS: true, logging: false });
        const imageBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`Could not encode slide ${index + 1}.`)), "image/jpeg", 0.92));
        const image = await pdf.embedJpg(new Uint8Array(await imageBlob.arrayBuffer()));
        const pageWidth = 960;
        const pageHeight = pageWidth * image.height / image.width;
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        canvas.width = 0;
        canvas.height = 0;
      }
      const pdfData = await pdf.save({ useObjectStreams: true });
      setOutput(pdfData);
      downloadPdf(pdfData, `${file?.name.replace(/\.pptx$/i, "") ?? "presentation"}.pdf`);
      setMessage("Presentation converted and downloaded. Each slide is one PDF page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not convert this presentation.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return <section className={styles.workspace}>
    <div className={styles.heading}><div><p className="eyebrow">PRIVATE IN-BROWSER CONVERTER</p><h1>Convert PowerPoint to PDF</h1><p>Render PPTX slides on this device and export them as PDF pages.</p></div><button className="primary-button" onClick={convertToPdf} disabled={busy || !slideCount}><Download size={16} /> {busy ? "Converting..." : "Convert to PDF"}</button></div>
    <div className={styles.controls}><label className={styles.uploadButton}><FilePlus2 size={17} /> {file ? "Replace PPTX" : "Choose PowerPoint"}<input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => void selectFile(event.target.files?.[0])} /></label>{file && <span className={styles.fileName}><FileText size={15} />{file.name}{slideCount ? ` · ${slideCount} slides` : ""}</span>}{slideCount > 0 && <div className={styles.navigation}><button onClick={() => setSlideIndex((index) => Math.max(0, index - 1))} disabled={busy || slideIndex === 0} aria-label="Previous slide"><ChevronLeft size={17} /></button><span>Slide {slideIndex + 1} of {slideCount}</span><button onClick={() => setSlideIndex((index) => Math.min(slideCount - 1, index + 1))} disabled={busy || slideIndex === slideCount - 1} aria-label="Next slide"><ChevronRight size={17} /></button></div>}</div>
    {message && <p className={styles.message} role="status">{message}</p>}{progress && <p className={styles.progress} aria-live="polite">{progress}</p>}
    <div className={styles.previewPanel}><div className={styles.rendererViewport} hidden={!slideCount}><div ref={hostRef} className={styles.rendererHost} /></div>{!slideCount && <label className={styles.emptyState}><FilePlus2 size={27} /><strong>Choose a PPTX presentation</strong><span>Slides are parsed and rendered locally. Legacy .ppt files aren’t supported.</span><input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => void selectFile(event.target.files?.[0])} /></label>}</div>
    {output && <div className={styles.outputPreview}><PdfThumbnail data={output} label="Converted PDF · page 1" /></div>}
    <p className={styles.note}>Slide transitions, embedded media, and some fonts or effects may not be reproduced exactly.</p>
  </section>;
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}