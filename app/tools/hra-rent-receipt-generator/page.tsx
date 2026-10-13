import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RentReceiptGenerator } from "@/components/tools/RentReceiptGenerator";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description = "Generate 12 printable monthly HRA rent receipts in a three-page A4 PDF. Add tenant and landlord details, rent, PAN threshold checks, and payment mode privately in your browser.";
const steps: ToolHowToStep[] = [
  { name: "Enter tenant and landlord details", text: "Add names, addresses, PAN details where needed, and rent amount." },
  { name: "Choose period and payment mode", text: "Select the receipt month or year range and enter payment details." },
  { name: "Review and export", text: "Check dates and amounts, then download or print the receipts as PDF." },
];
const faqs: ToolFaq[] = [
  { question: "Can I create HRA rent receipts for a full year?", answer: "The generator supports a set of 12 monthly receipts in a multi-page A4 PDF." },
  { question: "When is the landlord PAN required?", answer: "PAN requirements depend on current tax rules and circumstances. The tool provides a threshold check; confirm the rule for your tax year." },
  { question: "Can these receipts guarantee HRA tax exemption under Section 10(13A)?", answer: "No. Receipts are supporting records and do not establish eligibility by themselves. Consult current tax rules or a qualified tax professional." },
  { question: "Are rent details sent to a server?", answer: "Receipt fields and PDF creation are processed locally in your browser." },
];
export const metadata: Metadata = {
  alternates: { canonical: "/tools/hra-rent-receipt-generator" },
  title: "HRA Rent Receipt | Printable PDF",
  description,
};

export default function RentReceiptGeneratorPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar"><Link className="back-link" href="/"><ArrowLeft size={17} /> HRA Rent Receipt</Link></header>
      <JsonLdSchema name="HRA Rent Receipt" path="/tools/hra-rent-receipt-generator" description={description} faqs={faqs} howTo={{ name: "Generate HRA rent receipts", steps }} />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <RentReceiptGenerator />
      <ToolContentSection
        title="HRA rent receipt format and tax records"
        introduction="Prepare monthly rent receipts as supporting records for rent paid. Receipt creation does not determine HRA exemption; applicable income-tax requirements and supporting documents depend on the taxpayer's circumstances."
        steps={steps}
        specifications={[
          { label: "Document", value: "Monthly receipts; a 12-month set is laid out across three A4 pages." },
          { label: "Information", value: "Enter tenant, landlord, rent period, amount, and payment mode." },
          { label: "PAN", value: "Threshold checks are reminders; verify current tax-year rules." },
          { label: "Tax treatment", value: "Section 10(13A) eligibility is not calculated or guaranteed by this receipt tool." },
        ]}
        privacy="Receipt fields and PDF generation are processed locally in the browser. Review the details before sharing or submitting."
        faqs={faqs}
      />
    </main>
  );
}
