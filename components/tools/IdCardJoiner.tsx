"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileImage, FileText, RotateCcw, RotateCw, Scissors, Upload, X } from "lucide-react";
import { useMonetizedAction } from "@/lib/hooks/useMonetizedAction";
import styles from "./IdCardJoiner.module.css";

type Side = "front" | "back";
type PaperSize = "a4" | "photo";
type Layout = "stack" | "fold";
type ScaleMode = "original" | "cr80" | "custom";
type FitMode = "fit" | "fill";
type CardImages = Record<Side, File | null>;
type Rotations = Record<Side, number>;

const DPI = 300;
const CR80_WIDTH = Math.round(85.6 / 25.4 * DPI);
const CR80_HEIGHT = Math.round(54 / 25.4 * DPI);
const PAPERS: Record<PaperSize, { width: number; height: number; widthIn: number; heightIn: number; label: string }> = {
  a4: { width: 2480, height: 3508, widthIn: 210 / 25.4, heightIn: 297 / 25.4, label: "A4 · 210 × 297 mm" },
  photo: { width: 1200, height: 1800, widthIn: 4, heightIn: 6, label: "Photo paper · 4 × 6 in" },
};

export function IdCardJoiner() {
  const runMonetizedAction = useMonetizedAction();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);
  const [images, setImages] = useState<CardImages>({ front: null, back: null });
  const [rotations, setRotations] = useState<Rotations>({ front: 0, back: 0 });
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [layout, setLayout] = useState<Layout>("stack");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("cr80");
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [customScale, setCustomScale] = useState(100);
  const [guides, setGuides] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const drawSheet = useCallback(async () => {
    const renderId = ++renderIdRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return "";
    const sheet = PAPERS[paper];
    canvas.width = sheet.width;
    canvas.height = sheet.height;
    const context = canvas.getContext("2d");
    if (!context) return "Canvas is unavailable in this browser.";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, sheet.width, sheet.height);
    if (!images.front || !images.back) return "";

    const bitmaps: Partial<Record<Side, ImageBitmap>> = {};
    try {
      bitmaps.front = await createImageBitmap(images.front);
      bitmaps.back = await createImageBitmap(images.back);
      if (renderId !== renderIdRef.current) return "";

      const margin = paper === "a4" ? (layout === "fold" ? 180 : 170) : 72;
      const gap = paper === "a4" ? (layout === "fold" ? 96 : 210) : 105;
      const slotWidth = layout === "stack"
        ? sheet.width - margin * 2
        : (sheet.width - margin * 2 - gap) / 2;
      const slotHeight = layout === "stack"
        ? (sheet.height - margin * 2 - gap) / 2
        : sheet.height - margin * 2;
      const centers = layout === "stack"
        ? [
            { x: sheet.width / 2, y: margin + slotHeight / 2 },
            { x: sheet.width / 2, y: margin + slotHeight + gap + slotHeight / 2 },
          ]
        : [
            { x: margin + slotWidth / 2, y: sheet.height / 2 },
            { x: margin + slotWidth + gap + slotWidth / 2, y: sheet.height / 2 },
          ];

      (["front", "back"] as const).forEach((side, index) => {
        const bitmap = bitmaps[side];
        if (bitmap) drawCard(context, bitmap, centers[index], slotWidth, slotHeight, rotations[side], scaleMode, customScale, fitMode);
      });

      if (guides) {
        context.save();
        context.strokeStyle = "#8b9299";
        context.lineWidth = 3;
        context.setLineDash([16, 14]);
        context.beginPath();
        if (layout === "stack") {
          context.moveTo(margin, sheet.height / 2);
          context.lineTo(sheet.width - margin, sheet.height / 2);
        } else {
          context.moveTo(sheet.width / 2, margin);
          context.lineTo(sheet.width / 2, sheet.height - margin);
        }
        context.stroke();
        context.restore();
      }
      return "";
    } catch {
      return "Could not process one of these images. Try a smaller JPG, PNG, or WebP file.";
    } finally {
      bitmaps.front?.close();
      bitmaps.back?.close();
    }
  }, [customScale, fitMode, guides, images, layout, paper, rotations, scaleMode]);

  useEffect(() => {
    let active = true;
    void drawSheet().then((renderError) => { if (active) setError(renderError); });
    return () => { active = false; };
  }, [drawSheet]);

  async function chooseImage(side: Side, file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Each image must be smaller than 25 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const validDimensions = bitmap.width * bitmap.height <= 60_000_000;
      bitmap.close();
      if (!validDimensions) {
        setError("This image has too many pixels to process safely. Resize it and try again.");
        return;
      }
      setImages((current) => ({ ...current, [side]: file }));
      setError("");
    } catch {
      setError("This image could not be opened. Try exporting it as JPG, PNG, or WebP.");
    }
  }

  function rotate(side: Side, degrees: number) {
    setRotations((current) => ({ ...current, [side]: (current[side] + degrees + 360) % 360 }));
  }

  function clearImage(side: Side) {
    setImages((current) => ({ ...current, [side]: null }));
    setRotations((current) => ({ ...current, [side]: 0 }));
  }

  async function downloadJpeg() {
    const canvas = canvasRef.current;
    if (!canvas || !images.front || !images.back) return;
    setBusy(true);
    setError("");
    try {
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.96);
      runMonetizedAction(() => downloadBlob(blob, `id-card-front-back-${paper === "a4" ? "a4" : "4x6"}.jpg`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the JPEG.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    const canvas = canvasRef.current;
    if (!canvas || !images.front || !images.back) return;
    setBusy(true);
    setError("");
    try {
      const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.96);
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([PAPERS[paper].widthIn * 72, PAPERS[paper].heightIn * 72]);
      const image = await pdf.embedJpg(await jpeg.arrayBuffer());
      page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const bytes = await pdf.save();
      const pdfBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(pdfBuffer).set(bytes);
      runMonetizedAction(() => downloadBlob(new Blob([pdfBuffer], { type: "application/pdf" }), `id-card-front-back-${paper === "a4" ? "a4" : "4x6"}.pdf`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the print-ready PDF.");
    } finally {
      setBusy(false);
    }
  }

  function printDirectly() {
    const body = document.body;
    const cleanup = () => body.classList.remove("id-card-printing");
    body.classList.add("id-card-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    runMonetizedAction(() => window.print());
    window.setTimeout(cleanup, 1500);
  }

  const ready = Boolean(images.front && images.back);
  const paperClass = paper === "a4" ? styles.paperA4 : styles.paperPhoto;

  return (
    <section className={`${styles.tool} ${paperClass}`}>
      <header className={styles.intro}>
        <div><p className={styles.eyebrow}>PRINT &amp; PREPARE</p><h1>ID card Joiner</h1></div>
      </header>

      <div className={styles.workspace}>
        <div className={styles.controls}>
          <div className={styles.uploadGrid}>
            {(["front", "back"] as const).map((side) => <ImageDropzone key={side} side={side} file={images[side]} rotation={rotations[side]} onFile={(file) => void chooseImage(side, file)} onRotate={(degrees) => rotate(side, degrees)} onRemove={() => clearImage(side)} />)}
          </div>

          <div className={styles.optionGrid}>
            <label>Paper size<select value={paper} onChange={(event) => setPaper(event.target.value as PaperSize)}>{Object.entries(PAPERS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
            <label>Layout<select value={layout} onChange={(event) => setLayout(event.target.value as Layout)}><option value="stack">Vertical stack · front then back</option><option value="fold">Side-by-side · fold layout</option></select></label>
          </div>

          <fieldset className={styles.fieldset}>
            <legend>Card scale</legend>
            <div className={styles.choiceRow}>
              <label><input type="radio" name="card-scale" checked={scaleMode === "original"} onChange={() => setScaleMode("original")} /><span>Original size</span></label>
              <label><input type="radio" name="card-scale" checked={scaleMode === "cr80"} onChange={() => setScaleMode("cr80")} /><span>Wallet card · CR80</span></label>
              <label><input type="radio" name="card-scale" checked={scaleMode === "custom"} onChange={() => setScaleMode("custom")} /><span>Custom</span></label>
            </div>
            {scaleMode === "custom" && <label className={styles.slider}>Custom scale <strong>{customScale}%</strong><input type="range" min="50" max="150" step="1" value={customScale} onChange={(event) => setCustomScale(Number(event.target.value))} /></label>}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Image fit · applied to both sides</legend>
            <div className={styles.choiceRow}>
              <label><input type="radio" name="image-fit" checked={fitMode === "fit"} onChange={() => setFitMode("fit")} /><span>Fit · show entire image</span></label>
              <label><input type="radio" name="image-fit" checked={fitMode === "fill"} onChange={() => setFitMode("fill")} /><span>Fill · crop to card</span></label>
            </div>
          </fieldset>

          <label className={styles.guideToggle}><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} /><Scissors size={16} /> Show cut / fold guide</label>
          <p className={styles.note}>CR80 wallet cards measure 85.6 × 54 mm. Original size uses source pixels at 300 DPI and only reduces images as needed to fit the page. Images are never stretched; photo paper scales the layout to fit.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.buttonPrimary} disabled={!ready || busy} onClick={() => void downloadPdf()}><FileText size={17} /> Print-ready PDF</button>
            <button type="button" className={styles.buttonSecondary} disabled={!ready || busy} onClick={() => void downloadJpeg()}><FileImage size={17} /> High-res JPEG</button>
            <button type="button" className={styles.buttonSecondary} disabled={!ready} onClick={printDirectly}><Download size={17} /> Print directly</button>
          </div>
        </div>

        <div className={styles.previewColumn}>
          <div className={styles.previewHeading}><strong>Print preview</strong><span>{PAPERS[paper].label} · 300 DPI</span></div>
          <div className={styles.canvasFrame}>
            <canvas ref={canvasRef} className={styles.previewCanvas} aria-label="Print sheet preview with front and back ID card images" />
            {!ready && <div className={styles.emptyHint}><Upload size={25} /><strong>Upload both card sides</strong><span>Your print layout appears here.</span></div>}
          </div>
          <p className={styles.previewNote}>Actual printed size depends on selecting “Actual size” or 100% scale in your printer dialog.</p>
        </div>
      </div>
    </section>
  );
}

function ImageDropzone({ side, file, rotation, onFile, onRotate, onRemove }: { side: Side; file: File | null; rotation: number; onFile: (file?: File) => void; onRotate: (degrees: number) => void; onRemove: () => void }) {
  const title = side === "front" ? "Front Side of Card" : "Back Side of Card";
  return <div className={styles.dropzone}>
    <label className={styles.dropTarget} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFile(event.dataTransfer.files[0]); }}>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFile(event.target.files?.[0])} />
      <Upload size={20} />
      <strong>{title}</strong>
      <span>{file ? file.name : "Drop an image here or browse"}</span>
      <small>JPG, PNG, or WebP · max 25 MB</small>
    </label>
    {file && <div className={styles.imageActions}>
      <span>Rotation: {rotation}°</span>
      <button type="button" onClick={() => onRotate(-90)} aria-label={`Rotate ${side} 90 degrees counterclockwise`}><RotateCcw size={16} /></button>
      <button type="button" onClick={() => onRotate(90)} aria-label={`Rotate ${side} 90 degrees clockwise`}><RotateCw size={16} /></button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${side} image`}><X size={16} /></button>
    </div>}
  </div>;
}

function drawCard(context: CanvasRenderingContext2D, bitmap: ImageBitmap, center: { x: number; y: number }, slotWidth: number, slotHeight: number, rotation: number, scaleMode: ScaleMode, customScale: number, fitMode: FitMode) {
  const quarterTurn = Math.abs(rotation % 180) === 90;
  const naturalWidth = quarterTurn ? bitmap.height : bitmap.width;
  const naturalHeight = quarterTurn ? bitmap.width : bitmap.height;
  const factor = scaleMode === "original" ? 1 : scaleMode === "custom" ? customScale / 100 : 1;
  const desiredWidth = scaleMode === "original" ? naturalWidth : CR80_WIDTH * factor;
  const desiredHeight = scaleMode === "original" ? naturalHeight : CR80_HEIGHT * factor;
  const pageFit = Math.min(1, slotWidth / desiredWidth, slotHeight / desiredHeight);
  const cardWidth = desiredWidth * pageFit;
  const cardHeight = desiredHeight * pageFit;
  const x = center.x - cardWidth / 2;
  const y = center.y - cardHeight / 2;

  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, cardWidth, cardHeight);
  context.beginPath();
  context.rect(x, y, cardWidth, cardHeight);
  context.clip();
  context.translate(center.x, center.y);
  context.rotate(rotation * Math.PI / 180);
  const imageScale = fitMode === "fill"
    ? Math.max(cardWidth / naturalWidth, cardHeight / naturalHeight)
    : Math.min(cardWidth / naturalWidth, cardHeight / naturalHeight);
  const drawWidth = bitmap.width * imageScale;
  const drawHeight = bitmap.height * imageScale;
  context.drawImage(bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();

  context.save();
  context.strokeStyle = "#a9afb5";
  context.lineWidth = 3;
  context.setLineDash([]);
  context.strokeRect(x, y, cardWidth, cardHeight);
  context.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the print image.")), type, quality);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
