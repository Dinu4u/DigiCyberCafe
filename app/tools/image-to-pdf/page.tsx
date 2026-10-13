import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/image-to-pdf-converter" },
};

export default function ImageToPdfPage() {
  redirect("/tools/image-to-pdf-converter");
}