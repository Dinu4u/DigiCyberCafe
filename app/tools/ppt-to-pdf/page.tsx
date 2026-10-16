import type { Metadata } from "next";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";
import { PptxToPdfTool } from "@/components/tools/pdf/PptxToPdfTool";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/ppt-to-pdf" },
  title: "PowerPoint to PDF Converter | PPTX",
  description: "Convert PowerPoint PPTX presentations to PDF in your browser. Slides are rendered locally and exported one slide per PDF page.",
};

export default function PptToPdfPage() {
  return <PdfToolShell><PptxToPdfTool /></PdfToolShell>;
}