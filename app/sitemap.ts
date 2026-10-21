import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

const tools = [
  "/tools/barcode-qr-generator",
  "/tools/biodata-maker-marriage-job",
  "/tools/compress-pdf-to-target-kb",
  "/tools/corporate-email-format",
  "/tools/downloader",
  "/tools/free-invoice-generator",
  "/tools/hra-rent-receipt-generator",
  "/tools/image-background-remover",
  "/tools/id-card-front-back-joiner",
  "/tools/image-to-pdf-converter",
  "/tools/merge-pdf-files",
  "/tools/mutual-fund-sip-lumpsum-calculator",
  "/tools/passport-photo-maker",
  "/tools/passport-size-photo-maker",
  "/tools/pdf",
  "/tools/pdf-compress",
  "/tools/pdf-compressor-100kb",
  "/tools/pdf-editor",
  "/tools/pdf-watermark",
  "/tools/photo-enhancer-online",
  "/tools/photo-name-date-generator",
  "/tools/sarkari-exam-age-calculator",
  "/tools/sarkari-photo-resizer-50kb",
  "/tools/ppt-to-pdf",
  "/tools/sign-pdf-online",
  "/tools/split-pdf-pages",
  "/tools/target-kb-file-resizer",
  "/tools/text-to-pdf-converter",
  "/tools/translate-pdf-document",
  "/tools/universal-media-downloader",
  "/tools/video-compressor-reduce-size",
  "/tools/word-excel-to-pdf",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/builder/biodata` },
    ...["/about-us", "/contact-us", "/privacy-policy", "/terms-of-service"].map((path) => ({
      url: `${SITE_URL}${path}`,
    })),
    ...tools.map((path) => ({ url: `${SITE_URL}${path}` })),
  ];
}
