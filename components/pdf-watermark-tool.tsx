"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FilePlus2, FileText } from "lucide-react";
import { watermarkPdfFile } from "@/lib/pdf-tools";

export function PdfWatermarkTool() {
  const [file, setFile] = useState<File | null>(null); const [text, setText] = useState("CONFIDENTIAL"); const [message, setMessage] = useState("");
  async function exportWatermark() { if (!file) return setMessage("Choose a PDF first."); try { const blob = await watermarkPdfFile(file, text); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "watermarked-eCyberCafe.pdf"; anchor.click(); URL.revokeObjectURL(url); setMessage("Your watermarked PDF is ready."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not watermark the PDF."); } }
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href="/"><ArrowLeft size={17} /> PDF Watermark</Link></header><section className="pdf-workspace"><div className="pdf-workspace-heading"><div><p className="eyebrow">PDF TOOL</p><h1>Watermark a PDF</h1><p>Add a light text watermark to every page locally.</p></div><button className="primary-button" onClick={exportWatermark}><Download size={16} /> Export PDF</button></div><div className="pdf-input-panel split-panel"><label className="pdf-dropzone"><FilePlus2 size={24} /><strong>Drop a PDF here, or browse</strong><span>PDF files stay on this device</span><input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>{file && <div className="pdf-file-row"><FileText size={17} /><span>{file.name}</span></div>}<label className="page-range-label">Watermark text<input value={text} onChange={(event) => setText(event.target.value)} /></label>{message && <p className="pdf-message">{message}</p>}</div></section></main>;
}
