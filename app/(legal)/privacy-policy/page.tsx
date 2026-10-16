import type { Metadata } from "next";
import { BackToHome } from "@/components/navigation/BackToHome";
import { AD_CONFIG } from "@/config/adPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DigiCyberCafe handles browser-processed files, accounts, saved documents, media URLs, cookies, and advertising.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <BackToHome />
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Effective date: October 7, 2026</p>
      <div className="mt-8 space-y-7 leading-7 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Operator and contact</h2>
          <p className="mt-2">
            DigiCyberCafe is operated by {AD_CONFIG.PUBLISHER_INFO.NAME} in{" "}
            {AD_CONFIG.PUBLISHER_INFO.LOCATION}. Privacy questions and requests:
            {" "}<a className="underline" href={`mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}`}>{AD_CONFIG.PUBLISHER_INFO.EMAIL}</a>.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Files and tool processing</h2>
          <p className="mt-2">
            Many document, photo, and PDF editing tools process the file you select
            locally in your browser. For those workflows, the selected file is not
            uploaded to our file-processing server. This statement does not apply
            to every part of the service: if you register or sign in, account
            information is sent to our server; documents saved through the
            dashboard are stored in our database; and the media downloader sends
            a submitted media URL to a server-side service to inspect or stream
            media. Do not submit information unless you understand the relevant
            tool flow. Browser extensions, browser sync, and your device may also
            affect local data.
          </p>
          <p className="mt-2">
            The exam age calculator also supports a Hindu lunar birth-date input. Its birth
            date, optional birth time, and calendar selections are processed in your browser.
            If you use the city search, the city name you enter is sent to DigiCyberCafe and
            forwarded to Open-Meteo&apos;s geocoding service to retrieve city coordinates and
            time zone. The birth date and time are not included in that lookup. The returned
            location is used locally for sunrise and calendar calculations.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Information we handle</h2>
          <p className="mt-2">
            Depending on the feature used, information may include account name
            and email address, password hash, content and settings of documents
            you choose to save, a media URL you submit, and technical request
            information such as IP address, browser details, and timestamps
            handled by the application or its hosting and security providers.
            A Hindu-calendar city lookup also discloses the city query to Open-Meteo.
            Passwords are stored as hashes rather than readable passwords. The
            contact form opens your own email application; we receive a message
            only if you choose to send it.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Purposes and retention</h2>
          <p className="mt-2">
            We use information to operate requested features, authenticate users,
            store and retrieve documents users choose to save, protect service
            availability, diagnose failures, respond to support messages, and
            comply with legal obligations. Account and saved-document records
            remain until deleted by the user or until removal is requested, subject
            to technical backups and legal requirements. Server and security logs
            may be retained for limited periods by the service operator or hosting
            provider. We do not promise a specific retention interval for
            infrastructure logs controlled by third parties.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Cookies, analytics, Google services, and advertising</h2>
          <p className="mt-2">
            Essential session or security technologies may be used for sign-in and
            service operation. Google Analytics is loaded automatically when a
            page is visited; there is no analytics opt-in prompt on this site.
            Google Analytics may use cookies or similar technologies and process
            technical information such as page views, device/browser details, and
            approximate location.
            Google&apos;s data practices are described in its{" "}
            <a className="underline" href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">
              Privacy Policy
            </a>
            . Vercel Speed Insights collects web performance measurements from
            visits to help us monitor page speed and Core Web Vitals.
            If Google AdSense is enabled, Google and its partners may also use
            cookies, device identifiers, or similar technologies to serve, measure,
            and personalize ads, subject to their settings and policies. Google&apos;s
            advertising practices and choices are described
            in{" "}
            <a className="underline" href="https://policies.google.com/technologies/ads" rel="noreferrer" target="_blank">
              Google&apos;s Advertising Policies and Technologies
            </a>
            . References to a &quot;DART cookie&quot; are historical; current Google
            advertising may use different cookies or identifiers and should be
            reviewed through Google&apos;s current disclosures and controls.
            Depending on your location, additional consent or disclosures may be
            required before non-essential analytics or advertising technologies
            are used.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Choices and rights</h2>
          <p className="mt-2">
            You can control cookies in your browser, sign out, avoid server-backed
            features, and request access, correction, or deletion of account or
            saved-document information by contacting us. We will review requests
            under applicable law and may need to verify identity or retain limited
            information where legally required. Where the GDPR applies, processing
            may be necessary to provide a requested feature, meet a legal
            obligation, pursue legitimate interests such as service security, or
            rely on consent where requested; you may withdraw consent where that
            is the basis. GDPR rights may include access, rectification, erasure,
            restriction, portability, objection, and complaint to a supervisory
            authority. India&apos;s Digital Personal Data Protection Act, 2023 and
            rules or notifications in force may also apply. Contact the operator
            using the details above to raise a privacy grievance or request.
            These summaries do not replace the rights and procedures established
            by applicable law.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Providers and international processing</h2>
          <p className="mt-2">
            Hosting, database, authentication, advertising, translation, and
            geocoding
            providers may process information to deliver their services. For PDF
            translation, extracted text is sent to MyMemory only after you opt in
            through the tool; the PDF itself is processed in your browser. Some
            fonts or processing assets may also load from third-party hosts. The
            optional Hindu birth-date city search uses Open-Meteo geocoding; its
            provider disclosures are available in the{" "}
            <a className="underline" href="https://open-meteo.com/en/terms" rel="noreferrer" target="_blank">
              Open-Meteo terms
            </a>
            .
            Provider systems may operate outside your country and their own terms,
            safeguards, and retention policies may apply. We do not sell personal
            information as a standalone data-broker product.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Children and updates</h2>
          <p className="mt-2">
            The service is not designed to knowingly collect personal information
            from children without the permissions required by law. We may update
            this notice as features or legal requirements change; the effective
            date above will be revised when the policy changes materially.
          </p>
        </section>
      </div>
    </main>
  );
}
