import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CorporateEmailGenerator } from "@/components/tools/CorporateEmailGenerator";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/corporate-email-format" },
  title: "Corporate Email Format Generator | OOO, Leave & Resignation",
  description: "Create professional out-of-office replies, leave applications, resignation notices, and appraisal requests with editable corporate email formats.",
};

export default function CorporateEmailFormatPage() {
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link></header><CorporateEmailGenerator /></main>;
}