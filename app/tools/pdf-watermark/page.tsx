import type { Metadata } from "next";
import { PdfWatermarkTool } from "@/components/pdf-watermark-tool";

export const metadata: Metadata = {
  title: "Add a Text Watermark to a PDF Online",
  description:
    "Add a text watermark to a PDF in your browser and export the updated document. Review the file before sharing or submitting it.",
  alternates: { canonical: "/tools/pdf-watermark" },
};

export default function PdfWatermarkPage() {
  return <PdfWatermarkTool />;
}