import type { Metadata } from "next";
import { PdfWorkspace } from "@/components/pdf-workspace";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/pdf-editor" },
};

export default function PdfEditorPage() {
  return <PdfWorkspace mode="edit" />;
}