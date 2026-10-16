import type { Metadata } from "next";
import { PdfWorkspace } from "@/components/pdf-workspace";

export const metadata: Metadata = {
  title: "Edit PDF Online: Add Text or Cover Content",
  description:
    "Add text overlays or cover content on the first page of a PDF in your browser, then export and review the edited document.",
  alternates: { canonical: "/tools/pdf-editor" },
};

export default function PdfEditorPage() {
  return <PdfWorkspace mode="edit" />;
}