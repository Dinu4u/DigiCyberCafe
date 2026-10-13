import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InvoiceForm from "@/components/tools/invoicing/InvoiceForm";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const title = "Free Invoice & Quotation Generator | GST PDF, UPI QR";
const description =
  "Create a free online invoice or quotation for freelancers, plumbers, and small businesses. Add GST, a UPI payment QR, and download a printable PDF; your details stay in your browser.";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/free-invoice-generator" },
  title: { absolute: title },
  description,
  keywords: [
    "Free online invoice generator for freelancers",
    "plumber quotation maker",
    "small business estimate generator pdf",
    "gst invoice maker offline",
    "quotation to invoice",
  ],
};

const steps: ToolHowToStep[] = [
  { name: "Choose a document", text: "Select quotation, invoice, proforma invoice, or delivery challan, then enter the client and business details." },
  { name: "Add items and taxes", text: "Enter descriptions, quantity, unit price, discount, and any applicable tax. Check the live preview and calculated total." },
  { name: "Download or convert", text: "Download or print the PDF, or convert an approved quotation to an invoice without re-entering its line items." },
];

const faqs: ToolFaq[] = [
  { question: "Can I convert a quotation to an invoice?", answer: "Yes. Select Convert to Invoice. The document type and number change while the client information and line items remain in the form." },
  { question: "Can this create a GST invoice PDF?", answer: "The calculator can show GST and split it as CGST plus SGST or IGST. Check your applicable tax rate, invoice fields, and compliance requirements before issuing the document." },
  { question: "Does the tool save my business information?", answer: "The business profile and recurring items are saved in this browser's local storage. The tool does not upload that profile to its server." },
  { question: "Can customers pay with a UPI QR code?", answer: "When an INR document has a UPI ID and a positive total, the preview and downloadable PDF include a QR code containing the payee ID and total." },
];

export default function FreeInvoiceGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f6] px-4 pb-14 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="py-5 print:hidden">
          <Link href="/#tools" className="back-link">
            <ArrowLeft size={17} /> All tools
          </Link>
        </header>
        <JsonLdSchema
          name="Quotation to Invoice"
          path="/tools/free-invoice-generator"
          description={description}
          faqs={faqs}
          howTo={{ name: "Create and download a quotation or invoice", steps }}
        />
        <section className="mb-5 max-w-3xl print:hidden">
          <h1 className="text-4xl font-normal leading-tight tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Quotation to Invoice
          </h1>
        </section>
        <InvoiceForm />
        <AdBannerSlot slotId="invoice-rectangle" format="rectangle" className="my-8 print:hidden" />
        <ToolContentSection
          title="Free invoice and quotation maker"
          introduction="Prepare estimates, quotations, proforma invoices, and invoices for freelance work, services, repairs, or small business sales. Conversion keeps the existing client and item details in the browser."
          steps={steps}
          specifications={[
            { label: "Tax options", value: "GST (CGST + SGST or IGST), VAT, sales tax, or no tax." },
            { label: "Payment", value: "UPI QR for INR totals and optional bank transfer details." },
            { label: "Export", value: "Printable A4 PDF, browser print, and supported device sharing." },
            { label: "Currency", value: "INR, USD, EUR, and GBP display formats." },
          ]}
          privacy="Calculations, QR generation, and PDF creation run in the browser. Business details and recurring items are saved in this browser's local storage. File-sharing behavior depends on browser and device support."
          faqs={faqs}
        />
      </div>
    </main>
  );
}
