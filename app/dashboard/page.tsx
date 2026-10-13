import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";

export const metadata: Metadata = {
  title: "My Documents",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <main className="account-page"><Link href="/">Back to workspace</Link><p className="eyebrow">YOUR ACCOUNT</p><h1>Welcome, {session.user?.name ?? session.user?.email}.</h1><p>Your synced documents will appear here.</p><Link className="primary-button" href="/builder/biodata">Create a document</Link></main>;
}