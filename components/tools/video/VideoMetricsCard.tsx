"use client";

import { Download, TrendingDown, TrendingUp } from "lucide-react";
import type { VideoCompressionMetrics } from "@/types/videoCompressor";

type VideoMetricsCardProps = {
  originalName: string;
  originalBytes: number;
  compressedBytes: number;
  downloadUrl: string;
};

export function VideoMetricsCard({
  originalName,
  originalBytes,
  compressedBytes,
  downloadUrl,
}: VideoMetricsCardProps) {
  const metrics: VideoCompressionMetrics = {
    originalBytes,
    compressedBytes,
    differencePercent: originalBytes > 0
      ? ((originalBytes - compressedBytes) / originalBytes) * 100
      : 0,
    reducedBytes: originalBytes - compressedBytes,
  };
  const reduced = metrics.differencePercent > 0;
  const unchanged = metrics.differencePercent === 0;
  const outputName = `${originalName.replace(/\.[^.]+$/, "")}-compressed.mp4`;
  const DifferenceIcon = reduced ? TrendingDown : TrendingUp;

  return (
    <section className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="video-results-title" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Compression complete</p>
          <h2 id="video-results-title" className="mt-1 text-xl font-semibold text-slate-900">Your compressed video is ready</h2>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
          reduced ? "bg-emerald-100 text-emerald-800" : unchanged ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"
        }`}>
          {!unchanged && <DifferenceIcon size={16} aria-hidden="true" />}
          {unchanged
            ? "No size change"
            : `${reduced ? "" : "File increased by "}${Math.abs(metrics.differencePercent).toFixed(1)}%${reduced ? " smaller" : ""}`}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Original size</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatBytes(metrics.originalBytes)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Compressed size</p>
          <p className="mt-1 text-xl font-semibold text-emerald-900">{formatBytes(metrics.compressedBytes)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-600">
          {reduced
            ? `${formatBytes(metrics.reducedBytes)} saved (${metrics.differencePercent.toFixed(1)}% smaller).`
            : unchanged
              ? "The output is about the same size as the original."
              : `The output is ${formatBytes(Math.abs(metrics.reducedBytes))} larger (${Math.abs(metrics.differencePercent).toFixed(1)}%).`}
        </p>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          href={downloadUrl}
          download={outputName}
        >
          <Download size={17} aria-hidden="true" />
          Download MP4
        </a>
      </div>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
