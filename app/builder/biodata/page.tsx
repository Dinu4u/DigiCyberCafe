import type { Metadata } from "next";
import { DocumentBuilder } from "@/components/document-builder";

export const metadata: Metadata = {
  title: "Marriage Biodata Maker",
  description:
    "Create and export a personal marriage biodata profile using a private browser-based builder.",
  alternates: {
    canonical: "/builder/biodata",
  },
};

export default function BiodataPage() {
  return <DocumentBuilder />;
}
