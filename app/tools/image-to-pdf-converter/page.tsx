import type { Metadata } from "next";
import { PdfConverterTool } from "@/components/tools/pdf/PdfConverterTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/image-to-pdf-converter" },
  title: "Convert JPG to PDF Free | PNG & WebP to PDF",
  description: "Convert JPG to PDF free, or turn PNG and WebP images into print-ready PDF pages without uploading your files.",
};

export default function ImageToPdfConverterPage() {
  return <PdfToolShell><PdfConverterTool mode="image" /></PdfToolShell>;
}