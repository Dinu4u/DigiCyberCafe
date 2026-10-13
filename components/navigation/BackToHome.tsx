import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToHome() {
  return (
    <Link
      className="mb-7 inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
      href="/"
    >
      <ArrowLeft aria-hidden="true" size={16} />
      Back to Home
    </Link>
  );
}
