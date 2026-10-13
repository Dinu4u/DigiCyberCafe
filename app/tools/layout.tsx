import type { ReactNode } from "react";
import AdSenseContentSection from "@/components/content/AdSenseContentSection";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdSenseContentSection />
    </>
  );
}
