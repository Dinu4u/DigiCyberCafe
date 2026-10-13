import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExamPhotoGenerator } from "@/components/tools/ExamPhotoGenerator";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Generate passport size photos with printed candidate name and date of photo (DOP/DOPO) for SSC, UPSC, and government exams. Compress strictly under 20KB or 50KB online.";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/photo-name-date-generator" },
  title: "SSC & UPSC Photo with Name and Date (DOP) Maker | Free Target KB Resizer",
  description,
};

const steps: ToolHowToStep[] = [
  { name: "Add a photo", text: "Select a recent, clear candidate photograph with a plain background." },
  { name: "Enter print details", text: "Type the candidate name and date in the format required by the exam notification." },
  { name: "Check and download", text: "Review the final image and use the requested dimensions and file-size target before downloading." },
];
const faqs: ToolFaq[] = [
  { question: "Can I create an SSC or UPSC photo with name and date?", answer: "The tool can add a candidate name and date strip. Confirm the exact content, placement, date format, dimensions, and size against the current exam notice." },
  { question: "What does DOP or DOPO mean?", answer: "It refers to the date of photograph or date of photo. Exam authorities may specify different wording or formatting." },
  { question: "Does a 50 KB output guarantee exam acceptance?", answer: "No. Each recruitment authority sets its own photo size, dimensions, date, and appearance rules. Check the official application instructions." },
  { question: "Is my photograph uploaded?", answer: "Photo editing runs in the browser for this tool; the chosen image is not sent to an exam authority." },
];

export default function PhotoNameDateGeneratorPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar"><Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link></header>
      <JsonLdSchema
        name="SSC & UPSC Photo with Name and Date (DOP) Maker"
        path="/tools/photo-name-date-generator"
        description={description}
        faqs={faqs}
        howTo={{ name: "Create an exam photo with candidate name and date", steps }}
      />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <ExamPhotoGenerator />
      <section className="mx-auto max-w-5xl space-y-5 px-5 pb-8 pt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Exam photo checklist</h2>
        <p>Use a clear, recent color photograph with a plain white or light background. Face the camera directly, keep your head centered, and use even lighting so facial details remain sharp. Avoid shadows, filters, tinted glasses, and busy backgrounds.</p>
        <p>For exam uploads that require a date of photograph (DOP/DOPO), check the official notification for the exact label, date format, image dimensions, and file-size ceiling. The exam authority&apos;s current instructions always take precedence.</p>
      </section>
      <ToolContentSection
        title="Sarkari exam photo with date and target KB"
        introduction="Prepare an exam-photo layout and export for upload. The exam authority's current photo, name, date, dimension, and file-size instructions take precedence over any general preset."
        steps={steps}
        specifications={[
          { label: "Photo", value: "Recent, clear image with the framing and background specified by the exam." },
          { label: "Name and date", value: "Enter the exact candidate name and date format required by the notification." },
          { label: "Target size", value: "Choose the notification's file-size ceiling; common limits differ by exam." },
          { label: "Acceptance", value: "Always check the current official form requirements before upload." },
        ]}
        privacy="The photo layout is processed in the browser. Do not use a generated result unless it matches the receiving authority's instructions."
        faqs={faqs}
      />
    </main>
  );
}