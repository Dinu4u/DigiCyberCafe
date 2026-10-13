"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  AudioLines,
  Clipboard,
  Download,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import type {
  MediaExtractionError,
  MediaExtractionResponse,
  MediaFormat,
} from "@/types/mediaDownloader";
import { FormatCard } from "./FormatCard";
import styles from "./MediaDownloader.module.css";

type Filter = "all" | "video" | "audio" | "images";

const platformNames: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  twitter: "X / Twitter",
  facebook: "Facebook",
  tiktok: "TikTok",
  soundcloud: "SoundCloud",
  other: "Media",
};

const clipboardError: MediaExtractionError = {
  code: "extraction_failed",
  error: "Could not auto-paste from clipboard.",
  nextStep:
    "Please right-click and paste (Ctrl+V / Cmd+V) your link directly into the search box.",
};

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "images", label: "Images" },
];

export function MediaDownloader() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<MediaExtractionResponse | null>(null);
  const [error, setError] = useState<MediaExtractionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  async function fetchMedia() {
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/media/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = (await response.json()) as
        | MediaExtractionResponse
        | MediaExtractionError;
      if (!response.ok) {
        const details = body as MediaExtractionError;
        setError({
          code: details.code ?? "extraction_failed",
          error: details.error ?? "The media could not be fetched.",
          nextStep:
            details.nextStep ??
            "Check that the link is public and try again.",
        });
        return;
      }
      setResult(body as MediaExtractionResponse);
    } catch {
      setError({
        code: "temporary_failure",
        error: "Could not connect to the media service.",
        nextStep:
          "Check your internet connection, wait a moment, and try fetching the link again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function pasteFromClipboard() {
    setError(null);
    try {
      const pasted = await navigator.clipboard.readText();
      if (pasted.trim()) setUrl(pasted.trim());
    } catch {
      setError(clipboardError);
    }
  }

  const visibleFormats = (result?.formats ?? []).filter((format) => {
    if (filter === "video") return format.formatType.startsWith("video");
    if (filter === "audio") return format.formatType === "audio-only";
    if (filter === "images") return format.formatType === "image";
    return true;
  });

  return (
    <main className={styles.page}>
      <header className="builder-topbar">
        <Link className="back-link" href="/">
          <ArrowLeft size={17} /> Media downloader
        </Link>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <p className="eyebrow">PUBLIC MEDIA DOWNLOADER</p>
          <h1>Bring the good stuff<br /><em>with you.</em></h1>
          <p>Fetch available video and audio formats from a public link.</p>
        </div>

        <form
          id="downloader-search"
          className={styles.searchCard}
          onSubmit={(event) => {
            event.preventDefault();
            void fetchMedia();
          }}
        >
          <label className={styles.urlField}>
            <Link2 size={19} aria-hidden="true" />
            <span className={styles.srOnly}>Public media URL</span>
            <input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
                setResult(null);
              }}
              placeholder="Paste a YouTube, Instagram, TikTok, SoundCloud, or Facebook URL"
              type="text"
              inputMode="url"
              required
              aria-invalid={!!error}
            />
            {url && (
              <button
                className={styles.iconButton}
                onClick={() => {
                  setUrl("");
                  setResult(null);
                  setError(null);
                }}
                type="button"
                aria-label="Clear URL"
              >
                <X size={17} />
              </button>
            )}
            <button
              className={styles.iconButton}
              onClick={() => void pasteFromClipboard()}
              type="button"
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
            >
              <Clipboard size={17} />
            </button>
          </label>
          <div className={styles.actionRow}>
            <div className={styles.platformPills} aria-label="Supported platforms">
              <span>YouTube</span><span>Instagram Reels</span><span>X / Twitter</span>
              <span>Facebook</span><span>TikTok</span><span>SoundCloud</span>
            </div>
            <button className={styles.fetchButton} disabled={loading || !url.trim()} type="submit">
              {loading ? <LoaderCircle className={styles.spinner} size={17} /> : <Download size={17} />}
              {loading ? "Fetching..." : "Fetch Media"}
            </button>
          </div>
        </form>

        {error && (
          <section className={styles.errorAlert} role="alert">
            <AlertTriangle size={20} />
            <div>
              <strong>{error.error}</strong>
              <p><b>What to do:</b> {error.nextStep}</p>
              <button
                className={styles.retryButton}
                onClick={() => void fetchMedia()}
                disabled={loading || !url.trim()}
                type="button"
              >
                <RotateCcw size={14} /> Try again
              </button>
            </div>
          </section>
        )}

        {result && (
          <section className={styles.results} aria-label="Available media downloads">
            <article className={styles.mediaCard}>
              {result.thumbnailUrl ? (
                <Image
                  className={styles.thumbnail}
                  src={result.thumbnailUrl}
                  alt=""
                  width={480}
                  height={270}
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={styles.thumbnailFallback}><Video size={32} /></div>
              )}
              <div className={styles.mediaInfo}>
                <span className={styles.platformBadge}>
                  {platformNames[result.sourcePlatform] ?? "Media"}
                </span>
                <h2>{result.title}</h2>
                <p>{result.authorName || "Public media"}{result.durationFormatted ? ` · ${result.durationFormatted}` : ""}</p>
              </div>
            </article>

            <div className={styles.formatsPanel}>
              <div className={styles.formatHeader}>
                <h2>Available formats</h2>
                <span>{result.formats.length} options</span>
              </div>
              <div className={styles.filterTabs} role="tablist" aria-label="Filter formats">
                {filters.map((item) => (
                  <button
                    aria-selected={filter === item.id}
                    className={filter === item.id ? styles.activeTab : ""}
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    role="tab"
                    type="button"
                  >
                    {item.id === "video" ? <Video size={14} /> : item.id === "audio" ? <AudioLines size={14} /> : item.id === "images" ? <ImageIcon size={14} /> : null}
                    {item.label}
                  </button>
                ))}
              </div>
              {visibleFormats.length ? (
                <div className={styles.formatList}>
                  {visibleFormats.map((format: MediaFormat) => (
                    <FormatCard format={format} key={format.id} />
                  ))}
                </div>
              ) : (
                <p className={styles.noFormats}>No formats are available in this category for this link.</p>
              )}
            </div>
          </section>
        )}

        <div className={styles.privacyNote}>
          <ShieldCheck size={16} />
          <span>Downloads are processed securely. No personal media or search history is saved.</span>
        </div>
        <p className={styles.permissionNote}>
          Only download media you own or have permission to save. Private and restricted content is not supported.
        </p>
      </section>
    </main>
  );
}
