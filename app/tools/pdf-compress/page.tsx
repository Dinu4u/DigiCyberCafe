import type { Metadata } from "next";
import { StandardPdfCompressor } from "@/components/tools/pdf/StandardPdfCompressor";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  title: "Compress PDF Online | Reduce File Size",
  description:
    "Try browser-based PDF object-stream compression without rasterizing pages. File-size reduction varies by document; review the output before sharing or submitting it.",
  alternates: { canonical: "/tools/pdf-compress" },
};

export default function PdfCompressPage() {
  return <PdfToolShell><StandardPdfCompressor /></PdfToolShell>;
}