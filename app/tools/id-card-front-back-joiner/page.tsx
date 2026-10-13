import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IdCardJoiner } from "@/components/tools/IdCardJoiner";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Arrange front and back ID card photos on one A4 or 4×6 print sheet. Set CR80 or custom sizing, rotate, and export a print-ready PDF or JPEG privately in your browser.";
const steps: ToolHowToStep[] = [
  { name: "Add both card sides", text: "Select the front and back images of the card." },
  { name: "Choose layout and size", text: "Set the paper size, card scale such as CR80, orientation, and arrangement." },
  { name: "Preview and export", text: "Check placement and rotation, then export a PDF or JPEG for printing." },
];
const faqs: ToolFaq[] = [
  { question: "Can I put the front and back of an ID card on one page?", answer: "Yes. Choose a side-by-side or vertical layout and place both card images on an A4 or 4×6 print sheet." },
  { question: "What is CR80 card size?", answer: "CR80 is a common card dimension standard of approximately 85.60 × 53.98 mm. Check the desired printer scale before printing." },
  { question: "Can I print at actual size?", answer: "Choose the correct card scale and disable any 'fit to page' scaling in the print dialog when exact physical dimensions matter." },
  { question: "Are my card images uploaded?", answer: "The joining and export workflow processes the selected images in your browser." },
];
export const metadata: Metadata = {
  alternates: { canonical: "/tools/id-card-front-back-joiner" },
  title: "ID card Joiner | Print-Ready A4 & 4×6",
  description,
};

export default function IdCardJoinerPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar"><Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link></header>
      <JsonLdSchema name="ID Card Front and Back Joiner" path="/tools/id-card-front-back-joiner" description={description} faqs={faqs} howTo={{ name: "Arrange ID card front and back on a print sheet", steps }} />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <IdCardJoiner />
      <ToolContentSection
        title="CR80 ID card front and back print layout"
        introduction="Arrange card images on common A4 or 4×6 print paper. Confirm the card standard and disable printer scaling if you need an exact physical size."
        steps={steps}
        specifications={[
          { label: "Card size", value: "CR80 is approximately 85.60 × 53.98 mm; use custom sizing if your card differs." },
          { label: "Paper", value: "A4 or 4×6 inch sheet layouts." },
          { label: "Layout", value: "Place the front and back vertically or side by side; rotate images as needed." },
          { label: "Export", value: "Printable PDF or JPEG; check print scaling before production." },
        ]}
        privacy="The selected ID card images are processed in the browser and not uploaded by the joining workflow. Protect exported copies as sensitive documents."
        faqs={faqs}
      />
    </main>
  );
}
