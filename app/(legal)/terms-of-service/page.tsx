import type { Metadata } from "next";
import { BackToHome } from "@/components/navigation/BackToHome";
import { AD_CONFIG } from "@/config/adPolicy";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms, permitted use, and limitations for DigiCyberCafe utilities.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <BackToHome />
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-500">Effective date: October 7, 2026</p>
      <div className="mt-8 space-y-7 leading-7 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Agreement and operator</h2>
          <p className="mt-2">
            These terms apply when you use DigiCyberCafe, operated by {AD_CONFIG.PUBLISHER_INFO.NAME}
            {" "}in {AD_CONFIG.PUBLISHER_INFO.LOCATION}. If you do not agree, do not use
            the service. Contact{" "}
            <a className="underline" href={`mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}`}>{AD_CONFIG.PUBLISHER_INFO.EMAIL}</a>
            {" "}with questions.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Intended use and your content</h2>
          <p className="mt-2">
            Use tools only for lawful purposes and only with files and material
            you have the right to use. You are responsible for the accuracy,
            legality, backup, review, and final submission of content you enter,
            generate, download, or share. Do not attempt to disrupt, reverse
            engineer, abuse, or gain unauthorized access to the service or its
            providers. You are responsible for obtaining permission to use
            materials and complying with applicable copyright, privacy, and
            platform rules.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Tools are aids, not official advice</h2>
          <p className="mt-2">
            Calculations, formatting, image dimensions, compression, conversions,
            document templates, and generated output are provided as general
            utilities. Results can depend on your browser, input, settings, and
            the destination service. No photo, application, exam eligibility,
            financial estimate, tax document, or converted file is guaranteed to
            be accepted or accurate for a particular purpose. Check official
            instructions and review every result before relying on it. DigiCyberCafe
            is not affiliated with government agencies, exam authorities, or
            financial institutions.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Availability and third parties</h2>
          <p className="mt-2">
            Features are provided on an as-available basis and may change,
            temporarily fail, or be withdrawn. Some features depend on browser
            capabilities or third-party providers. Links and integrations with
            third parties are governed by their own terms and privacy notices.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Disclaimer and liability</h2>
          <p className="mt-2">
            To the extent permitted by applicable law, the service is provided
            without warranties, express or implied, including warranties of
            availability, fitness for a particular purpose, or error-free
            operation. To the extent permitted by law, DigiCyberCafe and its operator
            are not liable for indirect, incidental, special, consequential, or
            punitive loss, or for loss of data, business, opportunity, or
            submissions resulting from use of the service. Nothing in these terms
            excludes liability that cannot lawfully be excluded, or limits
            consumer rights that cannot be waived.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Changes and governing law</h2>
          <p className="mt-2">
            We may revise these terms as the service changes. The revised terms
            apply from publication. Applicable law and competent courts will be
            determined under mandatory rules; nothing here removes consumer
            protections that apply to you.
          </p>
        </section>
      </div>
    </main>
  );
}
