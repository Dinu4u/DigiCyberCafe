import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/merge-pdf-files" },
};

export default function PdfMergePage() {
  redirect("/tools/merge-pdf-files");
}
