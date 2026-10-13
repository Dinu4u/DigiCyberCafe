import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PassportPhotoCreator } from "@/components/tools/PassportPhotoCreator";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Create official passport and visa size photos online. Crop to 3.5x4.5cm or 2x2 inch, adjust brightness and contrast, and compress strictly under 20KB or 50KB for online forms.";
const steps: ToolHowToStep[] = [
  { name: "Choose a photo", text: "Upload a clear, recent, front-facing image with even lighting." },
  { name: "Set destination size", text: "Select the physical dimensions and file-size limit from the passport or visa instructions." },
  { name: "Crop and export", text: "Adjust framing and image appearance, then export and verify the result." },
];
const faqs: ToolFaq[] = [
  { question: "Which passport photo size should I choose?", answer: "Requirements vary by country, document, and online form. Check the official instructions; common examples include 35 × 45 mm or 2 × 2 inches." },
  { question: "Can I make a passport photo under 50 KB?", answer: "The tool supports target file-size exports where available. Verify the actual output and check the destination's exact limit." },
  { question: "Will one photo meet every visa requirement?", answer: "No. Cropping, pixel dimensions, background, head position, and file format vary by destination." },
  { question: "Is my photo uploaded?", answer: "The photo edit is performed in the browser for this tool. The image you select is not uploaded by the editing workflow." },
];
export const metadata: Metadata = {
  alternates: { canonical: "/tools/passport-photo-maker" },
  title: "Free Passport Size Photo Maker Online | Crop, Adjust & Compress to Target KB",
  description,
};

export default function PassportPhotoMakerPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar"><Link className="back-link" href="/"><ArrowLeft size={17} /> Passport Photo</Link></header>
      <JsonLdSchema name="Passport Size Photo Maker" path="/tools/passport-photo-maker" description={description} faqs={faqs} howTo={{ name: "Create a passport or visa photo", steps }} />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <PassportPhotoCreator />
      <section className="mx-auto max-w-5xl space-y-5 px-5 pb-8 pt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Passport photo rules to follow</h2>
        <p>Use a recent, front-facing photo with a neutral expression and eyes level with the camera. Keep the head centered and the background plain white or near-white so your face remains clearly visible.</p>
        <p>Check the exact official requirements for your destination before upload. Some forms ask for 35mm × 45mm or 3.5cm × 4.5cm, while others specify 2×2 inch or a different pixel count. This tool helps you match those standard sizes and compress to a target file size without leaving the browser.</p>
        <p>In general, avoid shadows, filters, glasses glare, tilted heads, and heavy retouching. A clean, evenly lit portrait produces the best print and digital upload result.</p>
      </section>
      <ToolContentSection
        title="Passport and visa photo dimensions"
        introduction="A passport-size photo has no single universal specification. Country and application rules control dimensions, pixel counts, background, framing, file type, and file size."
        steps={steps}
        specifications={[
          { label: "Common examples", value: "35 × 45 mm, 3.5 × 4.5 cm, or 2 × 2 inch; confirm the destination's current rule." },
          { label: "Framing", value: "Front-facing head, visible facial features, neutral expression, and even lighting." },
          { label: "File limit", value: "Follow the upload form's exact size and file-format limits." },
          { label: "Acceptance", value: "A preset does not guarantee compliance or approval by a passport or visa authority." },
        ]}
        privacy="Photo editing and export run in the browser for this tool. Review current official destination requirements before submitting."
        faqs={faqs}
      />
    </main>
  );
}
