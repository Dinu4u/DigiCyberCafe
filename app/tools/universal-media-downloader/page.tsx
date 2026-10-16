import type { Metadata } from "next";
import { MediaDownloader } from "@/components/tools/media/MediaDownloader";
import { DownloaderFaq } from "@/components/tools/media/DownloaderFaq";
import { CanonicalToolAeoContent } from "@/components/seo/CanonicalToolAeoContent";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/universal-media-downloader" },
  title: "Video and Audio Downloader | MP4, MP3",
  description:
    "Download supported public video and audio links in available formats such as MP4, WebM, and MP3. Formats and quality depend on the source; only download media you have permission to save.",
};

export default function UniversalMediaDownloaderPage() {
  return (
    <>
      <MediaDownloader />
      <CanonicalToolAeoContent slug="universal-media-downloader" />
      <DownloaderFaq />
    </>
  );
}
