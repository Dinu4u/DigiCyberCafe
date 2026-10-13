"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import styles from "./PdfThumbnail.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export function PdfThumbnail({ data, label, pageNumber = 1, className }: { data: Uint8Array; label: string; pageNumber?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadingTask = pdfjs.getDocument({ data: Uint8Array.from(data) });
    void loadingTask.promise.then(async (document) => {
      const page = await document.getPage(pageNumber);
      if (!active || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: 0.38 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas is not supported.");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, canvasContext: context, viewport, background: "#ffffff" }).promise;
      page.cleanup();
      await loadingTask.destroy();
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; void loadingTask.destroy(); };
  }, [data, pageNumber]);

  return <div className={`${styles.thumbnail} ${className ?? ""}`} aria-label={label}>{error ? <span>Preview unavailable</span> : <canvas ref={canvasRef} />}<small>{label}</small></div>;
}