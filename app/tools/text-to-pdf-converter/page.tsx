import type { Metadata } from "next";
import { PdfConverterTool } from "@/components/tools/pdf/PdfConverterTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/text-to-pdf-converter" },
  title: "Convert TXT to PDF Format | Print-Ready Text to PDF",
  description: "Convert TXT files to a print-ready PDF format with automatic line wrapping, pagination, and page numbers.",
};

export default function TextToPdfConverterPage() {
  return <PdfToolShell><PdfConverterTool mode="text" /></PdfToolShell>;
}