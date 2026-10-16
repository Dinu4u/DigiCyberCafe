import type { Metadata } from "next";
import { MediaDownloader } from "@/components/tools/media/MediaDownloader";
import { DownloaderFaq } from "@/components/tools/media/DownloaderFaq";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/universal-media-downloader" },
  title: "Video and Audio Downloader | MP4, MP3",
  description:
    "Download supported public video and audio links in available formats such as MP4, WebM, and MP3. Formats and quality depend on the source; only download media you have permission to save.",
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
