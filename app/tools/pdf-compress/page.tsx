import type { Metadata } from "next";
import { StandardPdfCompressor } from "@/components/tools/pdf/StandardPdfCompressor";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/pdf-compress" },
};

export default function PdfCompressPage() {
  return <PdfToolShell><StandardPdfCompressor /></PdfToolShell>;
}