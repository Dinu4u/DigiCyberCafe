import type { Metadata } from "next";
import Link from "next/link";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";

const path = "/guides/prepare-passport-photo-for-an-online-application";
const title = "How to Prepare a Passport or Visa Photo for an Online Application";
const description =
  "A destination-first checklist for selecting photo requirements, preparing a clear portrait, and checking the final passport or visa photo file.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
};

export default function PreparePassportPhotoGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <ArticleJsonLd path={path} headline={title} description={description} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link className="underline underline-offset-2" href="/guides">
          Guides
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Passport and visa photo</span>
      </nav>
      <article className="mt-7">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
            Photo preparation
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            There is no single passport or visa photo specification that works
            for every country and application. Find the current instructions
            for the exact form first, then prepare and check the image against
            each stated requirement.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            By Dinesh Kumar, DigiCyberCafe
          </p>
        </header>

        <div className="mt-9 space-y-8 leading-7 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Make a requirements checklist
            </h2>
            <p className="mt-3">
              Before editing, record the required physical or pixel
              dimensions, accepted file type, maximum file size, background,
              face position, expression, image recency, and rules about
              retouching or glasses. Use the issuing authority&apos;s current
              instructions; a size used for one passport, visa, or renewal
              service may not be accepted by another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Start with a suitable portrait
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Use a sharp, recent image with the face clearly visible.</li>
              <li>Choose even lighting and avoid strong shadows or glare.</li>
              <li>Keep the camera level and the face positioned as the rules require.</li>
              <li>Do not use edits or filters prohibited by the destination.</li>
            </ul>
            <p className="mt-3">
              A photo editor cannot turn a non-compliant source portrait into
              an officially acceptable photograph. If the source image is
              blurred, poorly lit, or unsuitable, take a new one instead of
              relying on aggressive enhancement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Crop, export, and verify
            </h2>
            <p className="mt-3">
              Use the{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/tools/passport-photo-maker"
              >
                passport and visa photo maker
              </Link>{" "}
              to crop and export a portrait, then compare the result with your
              checklist. Confirm the saved file&apos;s actual dimensions and size,
              open it at full resolution, and inspect framing, background,
              color, and facial detail. If the application has a photo preview
              or validation step, use that before submitting.
            </p>
            <p className="mt-3">
              If the image meets photo rules but exceeds the form&apos;s file-size
              limit, the{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/tools/target-kb-file-resizer"
              >
                target-size image resizer
              </Link>{" "}
              can help create a smaller copy. Recheck image quality and
              dimensions after resizing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Acceptance is decided by the issuing authority
            </h2>
            <p className="mt-3">
              Presets and editing tools are aids, not approval services. Rules
              can change, and a technically correct file can still be rejected
              for a different application requirement. Follow the official
              instructions for your destination and retain the original photo.
            </p>
            <p className="mt-3">
              This photo workflow is designed to edit the selected image in
              your browser. Other site features may use different processing
              routes; see the page-specific notice and{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/privacy-policy"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="mt-3">
              For one destination-specific example, see the{" "}
              <a
                className="font-medium underline underline-offset-2"
                href="https://www.gov.uk/photos-for-passports"
                rel="noreferrer"
                target="_blank"
              >
                UK government passport photo guidance
              </a>
              . This is UK guidance only; it does not define requirements for
              other European countries or visa applications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Common questions
            </h2>
            <h3 className="mt-4 font-semibold text-slate-900">
              Is there one passport photo size accepted everywhere?
            </h3>
            <p className="mt-2">
              No. Dimensions, framing, backgrounds, and digital upload rules
              vary by authority and application. Follow the current
              instructions for the exact destination.
            </p>
            <h3 className="mt-4 font-semibold text-slate-900">
              Does resizing guarantee that a photo will be accepted?
            </h3>
            <p className="mt-2">
              No. A tool can help edit dimensions and file size, but the
              issuing authority decides whether the photo meets its rules.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
