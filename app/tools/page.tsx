import type { Metadata } from "next";
import Link from "next/link";
import { publicToolDirectory } from "@/lib/seo/publicToolDirectory";

export const metadata: Metadata = {
  title: "All Free Online Tools",
  description:
    "Browse DigiCyberCafe's PDF, photo, document, exam, and business tools. Read each tool's processing notes and verify exported files before use.",
  alternates: { canonical: "/tools" },
};

const categories = [
  { id: "pdf-and-documents", name: "PDF and document tools" },
  { id: "photo-and-images", name: "Photo and image tools" },
  { id: "business-and-everyday", name: "Business and everyday tools" },
] as const;

export default function ToolsDirectoryPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
        DigiCyberCafe tools
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
        Browse all tools
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600">
        Choose a focused tool for your task. Processing differs by feature:
        check its instructions and privacy note, then inspect the exported
        result against the receiving service&apos;s current requirements.
      </p>
      <div className="mt-10 space-y-12">
        {categories.map(({ id, name }) => (
          <section aria-labelledby={`category-${id}`} key={id}>
            <h2
              className="text-2xl font-semibold text-slate-900"
              id={`category-${id}`}
            >
              {name}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicToolDirectory
                .filter((tool) => tool.category === name)
                .map((tool) => (
                  <li
                    className="rounded-xl border border-slate-200 bg-white p-5"
                    key={tool.path}
                  >
                    <h3 className="font-semibold text-slate-900">
                      <Link
                        className="hover:text-emerald-800 hover:underline"
                        href={tool.path}
                      >
                        {tool.name}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {tool.description}
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <aside className="mt-12 rounded-xl bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Need help choosing?
        </h2>
        <p className="mt-2 leading-7 text-slate-700">
          Read our practical guides on{" "}
          <Link
            className="font-medium underline underline-offset-2"
            href="/guides/reduce-file-size-for-online-forms"
          >
            reducing a file for an online form
          </Link>{" "}
          and{" "}
          <Link
            className="font-medium underline underline-offset-2"
            href="/guides/prepare-passport-photo-for-an-online-application"
          >
            preparing a passport or visa photo
          </Link>
          .
        </p>
      </aside>
    </main>
  );
}
