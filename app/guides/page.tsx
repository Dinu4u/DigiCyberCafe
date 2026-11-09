import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Practical Guides for Photo and Document Tools",
  description:
    "Step-by-step guidance for checking online upload requirements, reducing file sizes, and preparing passport or visa photos.",
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    href: "/guides/reduce-file-size-for-online-forms",
    title: "How to reduce a file for an online form",
    description:
      "Check the destination's limits, choose an appropriate image or PDF workflow, and verify the exported file before uploading.",
  },
  {
    href: "/guides/prepare-passport-photo-for-an-online-application",
    title: "How to prepare a passport or visa photo",
    description:
      "Use the application authority's exact photo rules to check framing, dimensions, format, background, and file size.",
  },
];

export default function GuidesPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
        Practical guides
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
        Prepare files with confidence
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600">
        Start with the requirements of the service receiving your file. These
        guides explain a careful workflow and link to tools that can help; they
        do not replace official application instructions.
      </p>
      <ul className="mt-9 grid gap-5 md:grid-cols-2">
        {guides.map((guide) => (
          <li
            className="rounded-xl border border-slate-200 bg-white p-6"
            key={guide.href}
          >
            <h2 className="text-xl font-semibold text-slate-900">
              <Link
                className="hover:text-emerald-800 hover:underline"
                href={guide.href}
              >
                {guide.title}
              </Link>
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              {guide.description}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-slate-600">
        <Link className="underline underline-offset-2" href="/tools">
          Browse all tools
        </Link>
      </p>
    </main>
  );
}
