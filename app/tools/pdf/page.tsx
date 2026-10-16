import type { Metadata } from "next";
import { PdfToolsHub } from "@/components/tools/pdf/PdfToolsHub";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  title: "PDF Tools: Merge, Split and Compress",
  description:
    "Use browser-based PDF tools to merge, split, compress, edit, and watermark documents. Review each tool's supported features and privacy details.",
  alternates: { canonical: "/tools/pdf" },
};

export default function PdfPage() {
  return <PdfToolShell isHub><PdfToolsHub /></PdfToolShell>;
}