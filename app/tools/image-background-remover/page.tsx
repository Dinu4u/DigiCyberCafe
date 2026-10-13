import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BackgroundRemover } from "@/components/tools/BackgroundRemover";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Remove image backgrounds free in your browser. Make transparent PNGs or replace a passport photo background with white, blue, gray, or custom art. Your photo is never uploaded.";
const steps: ToolHowToStep[] = [
  { name: "Upload a photo", text: "Choose the local source image to process." },
  { name: "Remove or replace the background", text: "Use the segmentation result and select transparent, solid-color, or custom background options." },
  { name: "Review and export", text: "Check fine edges, then download the processed image." },
];
const faqs: ToolFaq[] = [
  { question: "Does my image get uploaded?", answer: "The selected photo is processed in a browser worker on your device. Model files may be downloaded and cached." },
  { question: "Can I make a transparent PNG?", answer: "Yes. Choose a transparent background and export as PNG." },
  { question: "Why can hair or glass edges look imperfect?", answer: "Automatic segmentation estimates foreground boundaries. Fine hair, translucent items, or similar foreground/background colors can need manual retouching." },
  { question: "Why does the first run take longer?", answer: "The browser may need to download and cache model and runtime files before the first processing run." },
];

export const metadata: Metadata = {
  alternates: { canonical: "/tools/image-background-remover" },
  title: "Remove Image Background Free Online | Transparent PNG Maker Offline | Passport Photo White Background",
  description,
};

export default function ImageBackgroundRemoverPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar"><Link className="back-link" href="/"><ArrowLeft size={17} /> Background Remover</Link></header>
      <JsonLdSchema name="Image Background Remover" path="/tools/image-background-remover" description={description} faqs={faqs} howTo={{ name: "Remove an image background", steps }} />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <BackgroundRemover />
      <ToolContentSection
        title="Remove a photo background in your browser"
        introduction="Create a transparent image or replace the background with a plain color. Automatic masks may need manual review around thin, reflective, or low-contrast edges."
        steps={steps}
        specifications={[
          { label: "Processing", value: "Browser worker using a locally selected image and downloaded model assets." },
          { label: "Exports", value: "Transparent PNG or supported solid/custom background image output." },
          { label: "Edge quality", value: "Inspect hair, glass, and low-contrast boundaries before using the result." },
          { label: "First run", value: "Model and runtime assets may be downloaded and cached." },
        ]}
        privacy="The selected image is processed on your device and is not sent to the image segmentation server. The browser may fetch model assets."
        faqs={faqs}
      />
    </main>
  );
}