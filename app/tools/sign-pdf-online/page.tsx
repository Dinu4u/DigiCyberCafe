import type { Metadata } from "next";
import { SignPdfViewer } from "@/components/tools/pdf/SignPdfViewer";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/sign-pdf-online" },
  title: "Sign PDF Online Free | Add an Electronic Signature",
  description: "Draw a signature on a PDF, type your name, or upload an ink signature. Place it on a PDF page and download locally.",
};

export default function SignPdfOnlinePage() {
  return <PdfToolShell><SignPdfViewer /></PdfToolShell>;
}