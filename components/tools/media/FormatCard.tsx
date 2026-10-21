"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, LoaderCircle } from "lucide-react";
import type { MediaFormat } from "@/types/mediaDownloader";
import styles from "./MediaDownloader.module.css";

interface FormatCardProps {
  format: MediaFormat;
}

export function FormatCard({ format }: FormatCardProps) {
  const [started, setStarted] = useState(false);

  function startDownload() {
    setStarted(true);
    if (/^https?:\/\//i.test(format.downloadUrl)) {
      window.open(format.downloadUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(format.downloadUrl);
    }
    window.setTimeout(() => setStarted(false), 4000);
  }

  return (
    <div className={styles.formatRow}>
      <div className={styles.formatQuality}>
        <span className={styles.qualityBadge}>{format.qualityLabel}</span>
        <span className={styles.formatExtension}>.{format.extension}</span>
      </div>
      <span className={styles.formatSize}>
        {format.fileSizeApproxMB
          ? `${format.fileSizeApproxMB.toFixed(1)} MB`
          : "Size estimated on download"}
      </span>
      <button
        className={styles.downloadButton}
        onClick={startDownload}
        type="button"
        aria-label={`Download ${format.qualityLabel} ${format.extension}`}
      >
        {started ? (
          <>
            <LoaderCircle className={styles.spinner} size={15} />
            Starting
          </>
        ) : (
          <>
            {format.needsRemuxing ? <LoaderCircle size={15} /> : <ArrowDownToLine size={15} />}
            Download
          </>
        )}
      </button>
      {started && <span className={styles.srOnly} role="status"><Check /> Download started</span>}
    </div>
  );
}
