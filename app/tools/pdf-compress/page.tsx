import type { Metadata } from "next";
import { PdfWorkspace } from "@/components/pdf-workspace";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/pdf-compress" },
};

export default function PdfCompressPage() {
  return <PdfWorkspace mode="compress" />;
}