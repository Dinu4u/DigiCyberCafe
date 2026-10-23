import Link from "next/link";
import { AD_CONFIG } from "@/config/adPolicy";

const primaryLinks = [
  { href: "/#tools", label: "All Tools" },
  { href: "/tools/sarkari-exam-age-calculator", label: "Sarkari / Exam Tools" },
  { href: "/tools/pdf", label: "PDF Utilities" },
  { href: "/privacy-policy", label: "Privacy First" },
];

const legalLinks = [
  { href: "/about-us", label: "About" },
  { href: "/contact-us", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer
      className="!block !leading-6 !px-5 !py-8 border-t border-slate-200 bg-white text-sm text-slate-600 sm:!px-8 sm:!py-10"
      id="privacy-first"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-slate-700 sm:text-left">
            <Link className="font-medium text-slate-900 hover:underline" href="/">
              DigiCyberCafe
            </Link>
            <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
            made for the details
          </p>
          <p className="text-center text-slate-500 sm:text-right">
            <span className="font-medium text-slate-700">Privacy first</span>
            <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
            Many tools run locally when supported
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 border-y border-slate-100 py-4"
        >
          {primaryLinks.map(({ href, label }) => (
            <Link className="transition-colors hover:text-emerald-800 hover:underline hover:underline-offset-4" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-5 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="text-center sm:text-left">
            <p className="font-medium text-slate-800">DigiCyberCafe</p>
            <address className="mt-1 not-italic leading-6 text-slate-500">
              {AD_CONFIG.PUBLISHER_INFO.LOCATION}
              <br />
              <a
                className="break-words underline underline-offset-2 hover:text-slate-900"
                href={`mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}`}
              >
                {AD_CONFIG.PUBLISHER_INFO.EMAIL}
              </a>
            </address>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-slate-500 sm:mx-0">
              Browser-based document and exam utilities. Many tools process files
              on your device; account and saved-document features use our server
              as explained in the Privacy Policy.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <nav aria-label="Legal and company information" className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-end">
              {legalLinks.map(({ href, label }) => (
                <Link className="underline underline-offset-2 hover:text-slate-900" href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} DigiCyberCafe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
