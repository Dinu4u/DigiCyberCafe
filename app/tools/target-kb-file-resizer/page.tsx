import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TargetSizeResizer } from "@/components/tools/TargetSizeResizer";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Compress images and flatten PDFs to a strict KB target in your browser. Private, client-side file resizing with no upload required.";
const steps: ToolHowToStep[] = [
  { name: "Select a file", text: "Choose an image or PDF supported by the tool." },
  { name: "Set a target size", text: "Enter the maximum file size required by the form or destination." },
  { name: "Resize and save", text: "Run the local resizing process, inspect the resulting file size, and download the output." },
];
const faqs: ToolFaq[] = [
  { question: "Can I compress an image to a target KB size?", answer: "Yes. Choose an image, set a target size, and the tool attempts to produce an output within that limit." },
  { question: "Does it resize PDFs the same way as images?", answer: "PDF compression may flatten pages into images, which can change text selection and document structure." },
  { question: "Will the result always meet the target size?", answer: "The result depends on the source file and supported settings. Inspect the output and verify it before uploading." },
  { question: "Are my files uploaded?", answer: "Resizing in this tool runs in the browser. The selected source file is not uploaded by the resizing workflow." },
];

export const metadata: Metadata = {
  alternates: { canonical: "/tools/target-kb-file-resizer" },
  title: "Strict KB Target File Resizer for Images & PDFs",
  description,
};

export default function TargetKbFileResizerPage() {
  return <div className="tool-shell">
    <header className="builder-topbar">
      <Link className="back-link" href="/"><ArrowLeft size={17} /> File Resizer</Link>
    </header>
    <JsonLdSchema
      name="Target KB File Resizer"
      path="/tools/target-kb-file-resizer"
      description={description}
      faqs={faqs}
      howTo={{ name: "Resize an image or PDF to a target KB size", steps }}
    />
    <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
    <TargetSizeResizer />
    <ToolContentSection
      title="Compress a photo or PDF to a target KB size"
      introduction="Use a target KB image compressor to prepare images for an upload limit. PDF compression can flatten pages, so keep an original copy when document structure or searchable text matters."
      steps={steps}
      specifications={[
        { label: "Inputs", value: "Supported image formats and PDF documents." },
        { label: "Output", value: "A locally generated resized or compressed file; confirm the resulting size." },
        { label: "PDF note", value: "Flattening can remove selectable text and vector content." },
        { label: "Official limits", value: "Use the exact file-size and dimension requirements published by the receiving service." },
      ]}
      privacy="The selected file is processed locally by this tool's browser workflow; there is no server upload for the resize operation."
      faqs={faqs}
    />
  </div>;
}