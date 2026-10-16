import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PhotoEnhancer } from "@/components/tools/PhotoEnhancer";
import { CanonicalToolAeoContent } from "@/components/seo/CanonicalToolAeoContent";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/photo-enhancer-online" },
  title: "Free Online Photo Enhancer and Upscaler",
  description: "Adjust, sharpen, denoise, and upscale photos in your browser with a live comparison and JPEG, PNG, or WebP export.",
};

export default function PhotoEnhancerOnlinePage() {
  return <div className="tool-shell">
    <header className="builder-topbar">
      <Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link>
    </header>
    <PhotoEnhancer />
    <CanonicalToolAeoContent slug="photo-enhancer-online" />
  </div>;
}