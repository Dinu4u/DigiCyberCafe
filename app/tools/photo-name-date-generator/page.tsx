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
  title: "SSC and UPSC Exam Photo Name and Date Maker",
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
  { question: "Why might an exam portal reject my photo?", answer: "The file size, dimensions, background, framing, name/date text, or format may not match the current notification. Check the official requirements and verify the downloaded file before uploading." },
  { question: "Is my photo stored on a remote server?", answer: "For this tool, photo rendering and export run in your browser. The selected photo is not uploaded by this photo-editing workflow." },
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
        title="Prepare an exam photo with name and date"
        introduction="The SSC/UPSC preset renders a 413 × 531 px photo canvas and can add a candidate name and date strip; use the exam notification to confirm required dimensions, file size, format, and date text before submission."
        steps={steps}
        specifications={[
          { label: "SSC/UPSC preset", value: "413 × 531 px canvas (displayed as 3.5 × 4.5 cm in the tool); this is a preset, not a universal exam rule." },
          { label: "Other preset", value: "Passport preset: 600 × 600 px; custom width and height are also available." },
          { label: "Input formats", value: "JPG/JPEG, PNG, or WebP image; input files above 25 MB are rejected." },
          { label: "Output", value: "JPEG, PNG, or WebP; file-size target is optional and the tool reports if it cannot be reached." },
          { label: "Photo and text", value: "A recent photo can be combined with a candidate name and date; verify the receiving exam's current rules." },
          { label: "Name and date", value: "Enter the exact candidate name and date format required by the notification." },
          { label: "Acceptance", value: "Always check the current official form requirements before upload." },
        ]}
        privacy="This tool renders the photo and name/date strip using a browser canvas, and runs target-size compression in a browser worker where available. Its selected photo is not uploaded by this workflow. Other site features may use servers; see the Privacy Policy."
        faqs={faqs}
      />
    </main>
  );
}