import type { Metadata } from "next";
import { TargetKbPdfCompressor } from "@/components/tools/pdf/TargetKbPdfCompressor";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/compress-pdf-to-target-kb" },
  title: "Compress PDF to 200KB or 100KB Online",
  description: "Reduce PDF size to 100KB or compress PDF under 200KB for exam portals. Local target-size compression with adjustable KB limit.",
};

export default function CompressPdfToTargetKbPage() {
  return <PdfToolShell><TargetKbPdfCompressor /></PdfToolShell>;
}