import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PdfToolShell({ children }: { children: React.ReactNode }) {
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href="/"><ArrowLeft size={17} /> PDF Tools</Link></header>{children}</main>;
}