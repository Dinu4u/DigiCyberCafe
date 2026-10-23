import type { Metadata } from "next";
import Link from "next/link";
import { BackToHome } from "@/components/navigation/BackToHome";
import { AD_CONFIG } from "@/config/adPolicy";

export const metadata: Metadata = {
  title: "About DigiCyberCafe",
  description: "Learn about DigiCyberCafe, its operator, purpose, browser-based utilities, and privacy approach.",
  alternates: { canonical: "/about-us" },
};

export default function AboutUsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <BackToHome />
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">About DigiCyberCafe</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Practical digital tools, with clear limits</h1>
      <div className="mt-6 space-y-5 leading-7 text-slate-600">
        <p>
          DigiCyberCafe is an independent collection of document, photo, PDF, and
          everyday exam-related utilities operated by {AD_CONFIG.PUBLISHER_INFO.NAME}
          {" "}in Patna, Bihar, India. The aim is to make common digital tasks easier
          to understand and complete in a browser, including preparing documents
          and checking file dimensions before using another service.
        </p>
        <p>
          The site is built around a privacy-conscious approach: a number of tools
          process selected files directly in your browser, so those workflows do
          not send the file to our processing server. This is not true of every
          feature. Account registration and saved documents use server-side
          services. The media downloader is currently unavailable. Each tool should be judged by its own
          workflow; our <Link className="underline" href="/privacy-policy">Privacy Policy</Link>
          {" "}describes these distinctions.
        </p>
        <h2 className="pt-3 text-2xl font-semibold text-slate-900">Who maintains the site</h2>
        <p>
          Dinesh Kumar is the primary operator and contact for this independent
          project. We do not claim to be a government agency, examination board,
          passport authority, tax adviser, investment adviser, or legal service.
          Tools and educational notes are general-purpose aids, not a substitute
          for instructions from the authority or professional responsible for
          your decision.
        </p>
        <h2 className="pt-3 text-2xl font-semibold text-slate-900">Accuracy and improvement</h2>
        <p>
          We aim to make controls understandable, explain important limits, and
          provide ways to review generated results before saving or submitting
          them. Browser, device, input-file, and destination requirements can
          affect an outcome. Features may change as the project is maintained;
          users should check output carefully and follow the current official
          requirements for their particular task.
        </p>
        <h2 className="pt-3 text-2xl font-semibold text-slate-900">Contact and accountability</h2>
        <p>
          We welcome reports of errors, accessibility barriers, privacy concerns,
          and suggestions. Contact{" "}
          <a className="underline" href={`mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}`}>
            {AD_CONFIG.PUBLISHER_INFO.EMAIL}
          </a>
          {" "}or use the <Link className="underline" href="/contact-us">contact page</Link>.
        </p>
      </div>
      <address className="mt-8 border-t border-slate-200 pt-5 text-sm not-italic leading-6 text-slate-500">
        {AD_CONFIG.PUBLISHER_INFO.NAME}
        <br />
        {AD_CONFIG.PUBLISHER_INFO.LOCATION}
      </address>
    </main>
  );
}
