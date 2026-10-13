"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as pdfjs from "pdfjs-dist";
import { PDFDocument, degrees } from "pdf-lib";
import { Download, FilePlus2, FileText, Minus, PenLine, Plus } from "lucide-react";
import { SignaturePadModal } from "@/components/tools/pdf/SignaturePadModal";
import styles from "./SignPdfViewer.module.css";

type Placement = { x: number; y: number; width: number; height: number };
type DragState = { pointerId: number; startX: number; startY: number; placement: Placement; resizing: boolean };

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export function SignPdfViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [documentProxy, setDocumentProxy] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1.15);
  const [pageAspectRatio, setPageAspectRatio] = useState("595 / 842");
  const [signature, setSignature] = useState("");
  const [placement, setPlacement] = useState<Placement>({ x: 0.58, y: 0.72, width: 0.2, height: 0.09 });
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!pdfBuffer) return;
    let active = true;
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
    void loadingTask.promise.then((document) => {
      if (!active) return;
      setDocumentProxy(document);
      setPageIndex(0);
      setMessage("");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not read this PDF."));
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      void loadingTask.destroy();
    };
  }, [pdfBuffer]);

  useEffect(() => {
    if (!documentProxy || !canvasRef.current) return;
    let active = true;
    void documentProxy.getPage(pageIndex + 1).then((page) => {
      if (!active || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: zoom });
      setPageAspectRatio(`${viewport.width} / ${viewport.height}`);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return setMessage("This browser could not render the PDF page.");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const renderTask = page.render({ canvas, canvasContext: context, viewport, background: "#ffffff" });
      renderTaskRef.current = renderTask;
      return renderTask.promise.then(() => page.cleanup()).catch((error: unknown) => {
        if (error instanceof Error && error.name !== "RenderingCancelledException") setMessage(error.message);
      });
    });
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
    };
  }, [documentProxy, pageIndex, zoom]);

  async function selectPdf(selected?: File) {
    if (!selected) return;
    setFile(selected);
    setDocumentProxy(null);
    setPdfBuffer(await selected.arrayBuffer());
    setMessage("");
  }

  function moveSignature(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const bounds = stage.getBoundingClientRect();
    const deltaX = (event.clientX - drag.startX) / bounds.width;
    const deltaY = (event.clientY - drag.startY) / bounds.height;
    if (drag.resizing) {
      setPlacement({ ...drag.placement, width: clamp(drag.placement.width + deltaX, 0.08, 0.58), height: clamp(drag.placement.height + deltaY, 0.04, 0.34) });
    } else {
      setPlacement({ ...drag.placement, x: clamp(drag.placement.x + deltaX, 0, 1 - drag.placement.width), y: clamp(drag.placement.y + deltaY, 0, 1 - drag.placement.height) });
    }
  }

  function startPlacementDrag(event: React.PointerEvent<HTMLElement>, resizing = false) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, placement, resizing };
  }

  async function downloadSignedPdf() {
    if (!pdfBuffer || !signature || !documentProxy) return setMessage("Choose a PDF and add a signature first.");
    setBusy(true);
    setMessage("");
    try {
      const output = await PDFDocument.load(pdfBuffer);
      const pngBytes = dataUrlBytes(signature);
      const png = await output.embedPng(pngBytes);
      const page = output.getPage(pageIndex);
      const pdfPage = await documentProxy.getPage(pageIndex + 1);
      const viewport = pdfPage.getViewport({ scale: 1 });
      const stage = stageRef.current;
      if (!stage) throw new Error("The PDF page is not ready.");
      const left = placement.x * viewport.width;
      const top = placement.y * viewport.height;
      const right = (placement.x + placement.width) * viewport.width;
      const bottom = (placement.y + placement.height) * viewport.height;
      const [pdfLeft, pdfTop] = viewport.convertToPdfPoint(left, top);
      const [pdfRight, pdfBottom] = viewport.convertToPdfPoint(right, bottom);
      const pageRotation = page.getRotation().angle;
      const imageWidth = Math.abs(pdfRight - pdfLeft);
      const imageHeight = Math.abs(pdfBottom - pdfTop);
      const rotation = degrees(pageRotation ? -pageRotation : 0);
      page.drawImage(png, { x: Math.min(pdfLeft, pdfRight), y: Math.min(pdfTop, pdfBottom), width: imageWidth, height: imageHeight, rotate: rotation });
      const bytes = await output.save();
      const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file?.name.replace(/\.pdf$/i, "") ?? "document"}-signed.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Your signed PDF has been downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign this PDF.");
    } finally {
      setBusy(false);
    }
  }

  const pageCount = documentProxy?.numPages ?? 0;

  return <section className={styles.workspace}>
    <div className={styles.heading}><div><p className="eyebrow">PRIVATE IN-BROWSER PDF TOOL</p><h1>Sign a PDF online</h1><p>Add a drawn, typed, or uploaded signature. Your document stays on this device.</p></div><button className="primary-button" onClick={downloadSignedPdf} disabled={busy || !signature || !documentProxy}><Download size={16} /> {busy ? "Preparing..." : "Download signed PDF"}</button></div>
    <div className={styles.toolbar}><label className={styles.fileButton}><FilePlus2 size={16} /> {file ? "Replace PDF" : "Choose PDF"}<input type="file" accept="application/pdf,.pdf" onChange={(event) => void selectPdf(event.target.files?.[0])} /></label>{file && <span className={styles.fileName}><FileText size={15} />{file.name}</span>}<button className="secondary-button" onClick={() => setShowSignatureModal(true)}><PenLine size={15} /> {signature ? "Change signature" : "Create signature"}</button><div className={styles.zoomControls}><button onClick={() => setZoom((value) => clamp(value - 0.15, 0.55, 2.2))} aria-label="Zoom out"><Minus size={15} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => clamp(value + 0.15, 0.55, 2.2))} aria-label="Zoom in"><Plus size={15} /></button></div></div>
    <div className={styles.viewerLayout}>
      <div className={styles.pageNavigation}><button onClick={() => setPageIndex((page) => Math.max(0, page - 1))} disabled={pageIndex <= 0}>Previous</button><label>Page<input type="number" min={1} max={pageCount || 1} value={pageCount ? pageIndex + 1 : ""} disabled={!pageCount} onChange={(event) => setPageIndex(clamp(Number(event.target.value) - 1, 0, Math.max(0, pageCount - 1)))} /> of {pageCount || "-"}</label><button onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))} disabled={!pageCount || pageIndex >= pageCount - 1}>Next</button></div>
      <div className={styles.pdfStage}>
        {documentProxy ? <div className={styles.pageWrap} ref={stageRef} style={{ aspectRatio: pageAspectRatio }}><canvas ref={canvasRef} className={styles.pageCanvas} />{signature && <div className={styles.signatureBadge} style={{ left: `${placement.x * 100}%`, top: `${placement.y * 100}%`, width: `${placement.width * 100}%`, height: `${placement.height * 100}%` }} onPointerDown={(event) => startPlacementDrag(event)} onPointerMove={moveSignature} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}><Image src={signature} alt="Signature placement" fill unoptimized sizes="280px" draggable={false} /><span className={styles.resizeHandle} onPointerDown={(event) => startPlacementDrag(event, true)} aria-label="Resize signature" /></div>}</div> : <label className={styles.emptyState}><FileText size={28} /><strong>Choose a PDF to get started</strong><span>PDF pages are rendered locally in your browser.</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => void selectPdf(event.target.files?.[0])} /></label>}
      </div>
    </div>
    {message && <p className={styles.message} role="status">{message}</p>}
    {showSignatureModal && <SignaturePadModal onClose={() => setShowSignatureModal(false)} onSave={(value) => { setSignature(value); setShowSignatureModal(false); setMessage(""); }} />}
  </section>;
}

function dataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("The signature image is invalid.");
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}