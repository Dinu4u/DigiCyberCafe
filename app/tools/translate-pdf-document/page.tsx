import type { Metadata } from "next";
import { PdfTranslatorTool } from "@/components/tools/pdf/PdfTranslatorTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/translate-pdf-document" },
  title: "Translate PDF to Hindi, English and More",
  description: "Translate PDF document text between Hindi, English, Spanish, French, Bengali, Marathi, and more, then edit and download a rebuilt PDF.",
};

export default function TranslatePdfDocumentPage() {
  return <PdfToolShell><PdfTranslatorTool /></PdfToolShell>;
}