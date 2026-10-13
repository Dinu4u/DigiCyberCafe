import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CodeGeneratorSuite } from "@/components/tools/CodeGeneratorSuite";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/barcode-qr-generator" },
  title: "Free Barcode & QR Code Generator Online",
  description: "Create QR codes for Wi-Fi, UPI, contacts, and links, plus Code 128, EAN-13, UPC-A, and Code 39 barcodes. Works offline in your browser.",
};

export default function BarcodeQrGeneratorPage() {
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link></header><CodeGeneratorSuite /></main>;
}