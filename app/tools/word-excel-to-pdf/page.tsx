import type { Metadata } from "next";
import { PdfConverterTool } from "@/components/tools/pdf/PdfConverterTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";
import { CanonicalToolAeoContent } from "@/components/seo/CanonicalToolAeoContent";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/word-excel-to-pdf" },
  title: "Convert Word & Excel to PDF Offline",
  description: "Convert DOCX to PDF offline and turn XLSX spreadsheets into PDF client-side. Your office files stay in your browser.",
};

export default function WordExcelToPdfPage() {
  return <PdfToolShell><PdfConverterTool mode="office" /><CanonicalToolAeoContent slug="word-excel-to-pdf" /></PdfToolShell>;
}