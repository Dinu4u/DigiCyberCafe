import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact DigiCyberCafe",
  description:
    "Contact DigiCyberCafe in Patna, Bihar, India for questions, corrections, accessibility feedback, or tool issues.",
  alternates: { canonical: "/contact-us" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
