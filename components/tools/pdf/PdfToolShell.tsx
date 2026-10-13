import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PdfToolShell({ children, isHub = false }: { children: React.ReactNode; isHub?: boolean }) {
  const destination = isHub ? "/" : "/tools/pdf";
  const label = isHub ? "Home" : "PDF Tools";
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href={destination}><ArrowLeft size={17} /> {label}</Link></header>{children}</main>;
}