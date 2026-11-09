import type { Metadata } from "next";
import Link from "next/link";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";

const path = "/guides/reduce-file-size-for-online-forms";
const title = "How to Reduce a File for an Online Form";
const description =
  "A practical checklist for checking upload limits, choosing an image or PDF compression workflow, and verifying a smaller file before submission.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
};

export default function ReduceFileSizeGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <ArticleJsonLd path={path} headline={title} description={description} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link className="underline underline-offset-2" href="/guides">
          Guides
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Reduce file size</span>
      </nav>
      <article className="mt-7">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
            File preparation
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            If an upload is too large, first check the receiving service&apos;s
            exact file-size, format, and dimension rules. Then make a copy,
            choose a compression method suited to the file, and verify the
            exported result before uploading it.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            By Dinesh Kumar, DigiCyberCafe
          </p>
        </header>

        <div className="mt-9 space-y-8 leading-7 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              1. Read the upload requirements
            </h2>
            <p className="mt-3">
              Use the instructions on the actual application form, not a
              third-party summary. Note the maximum size, accepted file types,
              pixel or page dimensions, page count, and any quality or
              readability requirements. Some portals say KB while measuring
              bytes; leave a little room below the stated maximum and check the
              exported size in your file manager.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              2. Choose the right workflow
            </h2>
            <p className="mt-3">
              For supported images, use the{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/tools/target-kb-file-resizer"
              >
                image and PDF target-size resizer
              </Link>{" "}
              to work toward a chosen limit. For PDFs, choose between{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/tools/compress-pdf-to-target-kb"
              >
                target-size PDF compression
              </Link>{" "}
              and{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/tools/pdf-compress"
              >
                standard PDF compression
              </Link>
              . The target-size workflow rasterizes pages, so its output does
              not retain selectable text; standard compression may reduce the
              size less but does not rasterize pages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              3. Inspect the exported file
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Confirm the actual size, format, dimensions, and page count.</li>
              <li>Open the output and check readability, orientation, and all pages.</li>
              <li>Check signatures, faces, small text, and other critical details.</li>
              <li>Keep the original until the receiving service accepts the upload.</li>
            </ul>
            <p className="mt-3">
              If the file is still too large, start again from the original and
              adjust settings gradually. Recompressing an already-compressed
              copy can reduce quality without solving the size problem.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Privacy and limitations
            </h2>
            <p className="mt-3">
              These two resizing workflows are designed to process the selected
              file in your browser. Processing differs across the website, so
              check the individual tool notice and{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/privacy-policy"
              >
                Privacy Policy
              </Link>{" "}
              before using other features with sensitive material. A
              compression result is not a guarantee of acceptance by a portal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Common questions
            </h2>
            <h3 className="mt-4 font-semibold text-slate-900">
              Will compression always meet the upload limit?
            </h3>
            <p className="mt-2">
              No. The result depends on the source file and compression
              settings. Check the actual exported size and adjust from the
              original if needed.
            </p>
            <h3 className="mt-4 font-semibold text-slate-900">
              Does target-size PDF compression keep selectable text?
            </h3>
            <p className="mt-2">
              No. This target-size workflow rasterizes pages. Choose standard
              compression if preserving the text layer is important, and
              verify how much the file size changes.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
