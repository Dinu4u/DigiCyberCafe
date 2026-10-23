import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaDownloader } from "@/components/media-downloader";
import { MEDIA_DOWNLOADER_ENABLED } from "@/lib/media/availability";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/universal-media-downloader" },
};

export default function DownloaderPage() {
  if (!MEDIA_DOWNLOADER_ENABLED) notFound();

  return <MediaDownloader />;
}
