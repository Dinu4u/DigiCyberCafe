import type { Metadata } from "next";
import { PdfWatermarkTool } from "@/components/pdf-watermark-tool";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/pdf-watermark" },
};

export default function PdfWatermarkPage() {
  return <PdfWatermarkTool />;
}