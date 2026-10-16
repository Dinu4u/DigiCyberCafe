import Link from "next/link";
import { FileImage, FileText, Languages, Layers3, Minimize2, PenLine, Presentation, Scissors, Stamp, Table2, Type } from "lucide-react";

const tools = [
  { href: "/tools/image-to-pdf-converter", title: "Images to PDF", description: "Convert JPG, PNG, and WebP images to PDF.", icon: FileImage, tone: "image" },
  { href: "/tools/word-excel-to-pdf", title: "Word & Excel to PDF", description: "Convert DOCX and XLSX files in your browser.", icon: Table2, tone: "merge" },
  { href: "/tools/ppt-to-pdf", title: "PowerPoint to PDF", description: "Convert PPTX slides to PDF pages locally.", icon: Presentation, tone: "image" },
  { href: "/tools/text-to-pdf-converter", title: "Text to PDF", description: "Create paginated PDFs from TXT files.", icon: Type, tone: "compress" },
  { href: "/tools/merge-pdf-files", title: "Merge PDF files", description: "Combine documents in your chosen order.", icon: Layers3, tone: "merge" },
  { href: "/tools/split-pdf-pages", title: "Split PDF pages", description: "Extract ranges or create individual pages.", icon: Scissors, tone: "edit" },
  { href: "/tools/compress-pdf-to-target-kb", title: "Compress to target KB", description: "Reduce PDF size for strict upload limits.", icon: Minimize2, tone: "compress" },
  { href: "/tools/translate-pdf-document", title: "Translate a PDF", description: "Review and export translated document text.", icon: Languages, tone: "image" },
  { href: "/tools/sign-pdf-online", title: "Sign a PDF", description: "Draw, type, or upload an electronic signature.", icon: PenLine, tone: "edit" },
  { href: "/tools/pdf-compress", title: "Standard compression", description: "Optimize a PDF without rasterizing its pages.", icon: FileText, tone: "compress" },
  { href: "/tools/pdf-watermark", title: "Watermark PDF", description: "Add a light text watermark to each page.", icon: Stamp, tone: "edit" },
];

export function PdfToolsHub() {
  return <section className="pdf-hub"><p className="eyebrow">PDF WORKSPACE</p><h1>Make your PDFs<br /><em>more useful.</em></h1><p>PDF tools for everyday document work; processing details vary by operation.</p><div className="pdf-tool-grid">{tools.map(({ href, title, description, icon: Icon, tone }) => <Link className="pdf-tool-card" href={href} key={href}><span className={`pdf-tool-icon ${tone}`}><Icon size={22} /></span><strong>{title}</strong><span>{description}</span></Link>)}</div></section>;
}