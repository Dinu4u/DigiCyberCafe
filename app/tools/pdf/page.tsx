import type { Metadata } from "next";
import { PdfToolsHub } from "@/components/tools/pdf/PdfToolsHub";
import { PdfToolShell } from "@/components/tools/pdf/PdfToolShell";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/pdf" },
};

export default function PdfPage() {
  return <PdfToolShell><PdfToolsHub /></PdfToolShell>;
}