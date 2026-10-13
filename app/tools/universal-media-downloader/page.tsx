import type { Metadata } from "next";
import { MediaDownloader } from "@/components/tools/media/MediaDownloader";
import { DownloaderFaq } from "@/components/tools/media/DownloaderFaq";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/universal-media-downloader" },
  title: "Free Video & Audio Downloader Online | MP4, MP3 & Reels Extractor",
  description:
    "Download high quality videos, reels, and audio in MP4, WebM, and MP3 formats for free. Fast link-to-file extractor with multiple quality options.",
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Universal Media Downloader",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Download public video and audio when you have permission to save the media.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function UniversalMediaDownloaderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema).replace(/</g, "\\u003c"),
        }}
      />
      <MediaDownloader />
      <DownloaderFaq />
    </>
  );
}
