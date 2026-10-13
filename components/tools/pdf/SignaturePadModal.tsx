"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Eraser, ImagePlus, PenLine, Type, Upload, X } from "lucide-react";
import styles from "./SignaturePadModal.module.css";

type SignatureMode = "Draw" | "Type" | "Upload";
type SignatureColor = "#173f75" | "#111111";

const signatureFonts = ["Dancing Script", "Caveat", "Great Vibes", "Satisfy"];

export function SignaturePadModal({ onClose, onSave }: { onClose: () => void; onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const previousPointRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<SignatureMode>("Draw");
  const [color, setColor] = useState<SignatureColor>("#173f75");
  const [typedName, setTypedName] = useState("");
  const [font, setFont] = useState(signatureFonts[0]);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState("");
  const [threshold, setThreshold] = useState(225);
  const [error, setError] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Dancing+Script:wght@500;600&family=Great+Vibes&family=Satisfy&display=swap";
    document.head.append(link);
    const canvas = canvasRef.current;
    if (canvas) {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext("2d");
      context?.scale(ratio, ratio);
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 2.7;
      }
    }
    return () => link.remove();
  }, []);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) context.strokeStyle = color;
  }, [color]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!uploadedImage) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1200 / uploadedImage.width);
    canvas.width = Math.max(1, Math.round(uploadedImage.width * scale));
    canvas.height = Math.max(1, Math.round(uploadedImage.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      if (red >= threshold && green >= threshold - 8 && blue >= threshold - 18) pixels.data[index + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
    const preview = canvas.toDataURL("image/png");
    const frame = window.requestAnimationFrame(() => setUploadedPreview(preview));
    canvas.width = 0;
    canvas.height = 0;
    return () => window.cancelAnimationFrame(frame);
  }, [uploadedImage, threshold]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = pointFromEvent(event);
    previousPointRef.current = point;
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.x + 0.1, point.y + 0.1);
      context.stroke();
    }
  }

  function continueStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const current = pointFromEvent(event);
    const previous = previousPointRef.current;
    const context = canvasRef.current?.getContext("2d");
    if (context && previous) {
      const midpoint = { x: (previous.x + current.x) / 2, y: (previous.y + current.y) / 2 };
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.quadraticCurveTo(previous.x, previous.y, midpoint.x, midpoint.y);
      context.stroke();
    }
    previousPointRef.current = current;
  }

  function finishStroke() {
    drawingRef.current = false;
    previousPointRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function chooseUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file for your signature.");
    const image = document.createElement("img");
    const url = URL.createObjectURL(file);
    image.onload = () => { setUploadedImage(image); setError(""); URL.revokeObjectURL(url); };
    image.onerror = () => { setError("That image could not be opened."); URL.revokeObjectURL(url); };
    image.src = url;
  }

  async function exportTypedSignature() {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (!context || !typedName.trim()) return "";
    await document.fonts.load(`118px "${font}"`);
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `118px "${font}"`;
    context.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2, canvas.width - 40);
    return canvas.toDataURL("image/png");
  }

  function exportUploadedSignature() {
    return uploadedPreview;
  }

  async function saveSignature() {
    setError("");
    let dataUrl = "";
    if (mode === "Draw") dataUrl = canvasRef.current?.toDataURL("image/png") ?? "";
    if (mode === "Type") dataUrl = await exportTypedSignature();
    if (mode === "Upload") dataUrl = exportUploadedSignature();
    if (!dataUrl || dataUrl === "data:,") return setError("Add a signature before continuing.");
    onSave(dataUrl);
  }

  return <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="signature-title">
      <header className={styles.header}><div><p className="eyebrow">SIGNATURE</p><h2 id="signature-title">Create your signature</h2></div><button className={styles.iconButton} onClick={onClose} aria-label="Close signature dialog"><X size={18} /></button></header>
      <div className={styles.tabs} role="tablist" aria-label="Signature method">
        {(["Draw", "Type", "Upload"] as const).map((item) => <button key={item} role="tab" aria-selected={mode === item} className={mode === item ? styles.activeTab : ""} onClick={() => { setMode(item); setError(""); }}><span>{item === "Draw" ? <PenLine size={15} /> : item === "Type" ? <Type size={15} /> : <Upload size={15} />}</span>{item}</button>)}
      </div>
      {mode === "Draw" && <div className={styles.drawPanel}><div className={styles.padHeading}><span>Draw inside the area</span><button onClick={clearCanvas}><Eraser size={14} /> Clear</button></div><canvas ref={canvasRef} className={styles.canvas} aria-label="Draw your signature" onPointerDown={startStroke} onPointerMove={continueStroke} onPointerUp={finishStroke} onPointerCancel={finishStroke} /><div className={styles.controls}><span>Ink</span><button className={styles.colorSwatch} style={{ backgroundColor: "#173f75" }} aria-label="Blue ink" aria-pressed={color === "#173f75"} onClick={() => setColor("#173f75")} /><button className={styles.colorSwatch} style={{ backgroundColor: "#111111" }} aria-label="Black ink" aria-pressed={color === "#111111"} onClick={() => setColor("#111111")} /></div></div>}
      {mode === "Type" && <div className={styles.typePanel}><label>Your name<input value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder="Type your name" autoFocus /></label><label>Signature style<select value={font} onChange={(event) => setFont(event.target.value)}>{signatureFonts.map((fontName) => <option key={fontName}>{fontName}</option>)}</select></label><div className={styles.typePreview} style={{ color, fontFamily: `"${font}"` }}>{typedName || "Your signature"}</div></div>}
      {mode === "Upload" && <div className={styles.uploadPanel}><label className={styles.uploadButton}><ImagePlus size={20} /><strong>Choose signature image</strong><span>PNG, JPG, or WebP</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void chooseUpload(event.target.files?.[0])} /></label>{uploadedImage && <div className={styles.uploadPreview}><Image src={uploadedPreview || uploadedImage.src} alt="Uploaded ink signature with background removal preview" width={360} height={140} unoptimized /><div className={styles.thresholdControl}><label htmlFor="paper-threshold">Remove paper background</label><input id="paper-threshold" type="range" min="190" max="250" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /><span>{threshold}</span></div></div>}</div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <footer className={styles.footer}><button className={styles.cancelButton} onClick={onClose}>Cancel</button><button className="primary-button" onClick={saveSignature}><Check size={16} /> Use signature</button></footer>
    </section>
  </div>;
}