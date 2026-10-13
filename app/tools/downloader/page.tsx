import type { Metadata } from "next";
import { MediaDownloader } from "@/components/media-downloader";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/universal-media-downloader" },
};

export default function DownloaderPage() {
  return <MediaDownloader />;
}
