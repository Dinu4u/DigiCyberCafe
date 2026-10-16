import type { Metadata } from "next";
import { PdfOperationsTool } from "@/components/tools/pdf/PdfOperationsTool";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";
import { CanonicalToolAeoContent } from "@/components/seo/CanonicalToolAeoContent";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/merge-pdf-files" },
  title: "Merge PDF Files Online Free | PDF Joiner",
  description: "Combine multiple PDF files online in your chosen order. Free PDF joiner with local, private processing in your browser.",
};

export default function MergePdfFilesPage() {
  return <PdfToolShell><PdfOperationsTool mode="merge" /><CanonicalToolAeoContent slug="merge-pdf-files" /></PdfToolShell>;
}