import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/split-pdf-pages" },
};

export default function PdfSplitPage() {
  redirect("/tools/split-pdf-pages");
}
