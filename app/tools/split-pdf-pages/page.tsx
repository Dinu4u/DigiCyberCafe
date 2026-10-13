import type { Metadata } from "next";
import { PdfOperationsTool } from "@/components/tools/pdf/PdfOperationsTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/split-pdf-pages" },
  title: "Split PDF Pages & Extract Pages from PDF",
  description: "Extract pages from a PDF by range or split a PDF into individual pages. Download selected pages or a ZIP of separate PDFs.",
};

export default function SplitPdfPagesPage() {
  return <PdfToolShell><PdfOperationsTool mode="split" /></PdfToolShell>;
}