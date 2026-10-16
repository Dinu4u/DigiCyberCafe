"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  CreditCard,
  CircleDollarSign,
  FileText,
  Heart,
  Image as ImageIcon,
  Mail,
  QrCode,
  Receipt,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { emailTemplates } from "@/lib/constants/emailTemplates";
import AdBannerSlot from "@/components/ads/AdBannerSlot";

const tools = [
  {
    title: "PDF tools",
    description: "Merge, split, and watermark PDF files.",
    icon: FileText,
    color: "yellow",
    href: "/tools/pdf",
  },
  {
    title: "Marriage biodata",
    description: "Create a beautiful, culturally thoughtful profile.",
    icon: Heart,
    color: "coral",
    href: "/builder/biodata",
  },
  {
    title: "Media downloader",
    description: "Save video and audio from the web, simply.",
    icon: ArrowUpRight,
    color: "green",
    href: "/tools/universal-media-downloader",
  },
  {
    title: "Passport Size Photo Maker",
    description: "Crop, adjust, and compress passport and visa photos to compliant dimensions.",
    icon: Camera,
    color: "blue",
    href: "/tools/passport-photo-maker",
  },
  {
    title: "Reduce File Size",
    description: "Compress images and PDFs to a strict KB limit, privately.",
    icon: FileText,
    color: "yellow",
    href: "/tools/target-kb-file-resizer",
  },
  {
    title: "Background Remover",
    description: "Remove or replace photo backgrounds privately in your browser.",
    icon: ImageIcon,
    color: "green",
    href: "/tools/image-background-remover",
  },
  {
    title: "Photo Enhancer",
    description: "Enhance, sharpen, and upscale photos privately in your browser.",
    icon: Sparkles,
    color: "coral",
    href: "/tools/photo-enhancer-online",
  },
  {
    title: "ID card Joiner",
    description: "Arrange both card sides on one A4 or 4×6 print sheet, privately.",
    icon: CreditCard,
    color: "green",
    href: "/tools/id-card-front-back-joiner",
  },
  {
    title: "Calculate age & eligibility",
    description: "Check exact cutoff age and government exam eligibility.",
    icon: CalendarDays,
    color: "green",
    href: "/tools/sarkari-exam-age-calculator",
  },
  {
    title: "Mutual Fund Calculator",
    description: "Estimate SIP, lumpsum, and hybrid investment growth.",
    icon: CircleDollarSign,
    color: "blue",
    href: "/tools/mutual-fund-sip-lumpsum-calculator",
  },
  {
    title: "Quotation to Invoice",
    description: "Create quotations and invoices with PDF, UPI QR, and local autosave.",
    icon: Receipt,
    color: "coral",
    href: "/tools/free-invoice-generator",
  },
  {
    title: "Barcode & QR codes",
    description: "Create scan-ready codes privately, right in your browser.",
    icon: QrCode,
    color: "blue",
    href: "/tools/barcode-qr-generator",
  },
  {
    title: "Name & Date on Photo",
    description: "Create DOP photos and resize to exam upload limits.",
    icon: Camera,
    color: "yellow",
    href: "/tools/photo-name-date-generator",
  },
  {
    title: "Corporate Email Format",
    description: "Draft polished OOO, leave, resignation, and appraisal emails.",
    icon: Mail,
    color: "coral",
    href: "/tools/corporate-email-format",
  },
  {
    title: "HRA Rent Receipt",
    description: "Create one or 12 printable monthly rent receipts as a PDF.",
    icon: Receipt,
    color: "yellow",
    href: "/tools/hra-rent-receipt-generator",
  },
];

const quickTools = [
  { label: "PDF merge", hindi: "पीडीएफ मर्ज", icon: FileText, href: "/tools/merge-pdf-files" },
  { label: "PDF split", hindi: "पीडीएफ स्प्लिट", icon: FileText, href: "/tools/split-pdf-pages" },
  { label: "Downloader", hindi: "मीडिया डाउनलोडर", icon: ArrowUpRight, href: "/tools/universal-media-downloader" },
  { label: "PDF compressor", hindi: "पीडीएफ कंप्रेसर", icon: FileText, href: "/tools/compress-pdf-to-target-kb" },
  { label: "Sign PDF", hindi: "पीडीएफ पर हस्ताक्षर करें", icon: FileText, href: "/tools/sign-pdf-online" },
  { label: "Marriage Bio Data", hindi: "विवाह बायोडाटा", icon: Heart, href: "/builder/biodata" },
  { label: "Calculate age & eligibility", hindi: "सरकारी परीक्षा आयु कैलकुलेटर", icon: CalendarDays, href: "/tools/sarkari-exam-age-calculator" },
  { label: "Mutual Fund Calculator", hindi: "म्यूचुअल फंड कैलकुलेटर", icon: CircleDollarSign, href: "/tools/mutual-fund-sip-lumpsum-calculator" },
  { label: "Quotation to Invoice", hindi: "कोटेशन से इनवॉइस", icon: Receipt, href: "/tools/free-invoice-generator" },
];

type SearchItem = { title: string; hindi: string; description: string; href: string; icon: LucideIcon; keywords?: string };

const searchItems: SearchItem[] = [
  { title: "Quotation to Invoice", hindi: "कोटेशन से इनवॉइस", description: "Create quotations and invoices with PDF, UPI QR payments, and local business profile autosave.", href: "/tools/free-invoice-generator", icon: Receipt, keywords: "free invoice generator quotation estimate maker GST invoice pdf plumber tradesperson freelancer small business bill" },
  { title: "Mutual Fund Calculator", hindi: "म्यूचुअल फंड कैलकुलेटर", description: "Estimate SIP, one-time lumpsum, and hybrid mutual fund growth.", href: "/tools/mutual-fund-sip-lumpsum-calculator", icon: CircleDollarSign, keywords: "SIP lumpsum top up hybrid investment returns mutual fund calculator CAGR monthly quarterly half yearly yearly" },
  { title: "Calculate age & eligibility", hindi: "सरकारी परीक्षा आयु कैलकुलेटर", description: "Calculate exact cutoff age and compare central and state government exam eligibility.", href: "/tools/sarkari-exam-age-calculator", icon: CalendarDays, keywords: "Sarkari exam age calculator UPSC SSC railway age cutoff DOB date of birth eligibility age relaxation Hindi calendar Vikram Samvat Saka" },
  { title: "Marriage biodata", hindi: "विवाह बायोडाटा", description: "Build a marriage biodata profile and export it as PDF.", href: "/builder/biodata", icon: Heart, keywords: "bride groom family profile personal details education profession birth date style accent color quick tools marriage bio data" },
  { title: "ID card Joiner", hindi: "आईडी कार्ड आगे-पीछे जोड़ें", description: "Arrange both sides of an ID card on one A4 or photo-print sheet locally.", href: "/tools/id-card-front-back-joiner", icon: CreditCard, keywords: "identity card voter id aadhaar front back print sheet A4 4x6 CR80 wallet card cut fold rotate JPEG PDF" },
  { title: "Background Remover", hindi: "इमेज बैकग्राउंड रिमूवर", description: "Remove or replace photo backgrounds locally.", href: "/tools/image-background-remover", icon: ImageIcon, keywords: "transparent png white blue gray custom backdrop photo cutout" },
  { title: "Photo Enhancer", hindi: "फोटो एन्हांसर", description: "Enhance, sharpen, denoise, and upscale photos locally.", href: "/tools/photo-enhancer-online", icon: Sparkles, keywords: "auto fix portrait landscape document clarity brightness contrast exposure temperature saturation 2x" },
  { title: "Reduce File Size", hindi: "फ़ाइल का आकार घटाएं", description: "Compress images and PDFs to a strict KB target locally.", href: "/tools/target-kb-file-resizer", icon: FileText, keywords: "jpeg jpg png webp target size compression reduce kb" },
  { title: "Passport Size Photo Maker", hindi: "पासपोर्ट फोटो मेकर", description: "Crop and resize passport or visa photos to standard dimensions.", href: "/tools/passport-photo-maker", icon: Camera, keywords: "visa india schengen uk australia photo crop dpi portrait" },
  { title: "Name & Date on Photo", hindi: "नाम और तारीख़ के साथ फोटो", description: "Create exam photos with date of photography and candidate name.", href: "/tools/photo-name-date-generator", icon: Camera, keywords: "DOP exam candidate resize jpg png signature date" },
  { title: "Corporate Email Format", hindi: "कॉर्पोरेट ईमेल प्रारूप", description: "Draft out-of-office, leave, resignation, and appraisal emails.", href: "/tools/corporate-email-format", icon: Mail, keywords: "email templates office workplace message copy subject" },
  { title: "HRA Rent Receipt", hindi: "एचआरए किराया रसीद", description: "Create one or 12 printable monthly rent receipts as a PDF.", href: "/tools/hra-rent-receipt-generator", icon: Receipt, keywords: "house rent allowance HRA landlord tenant PAN receipt 1 month 12 months financial year tax exemption 10(13A) rent agreement" },
  { title: "Barcode & QR codes", hindi: "बारकोड और क्यूआर कोड", description: "Generate QR codes and barcodes in your browser.", href: "/tools/barcode-qr-generator", icon: QrCode, keywords: "scan barcode qr code ean upc code128" },
  { title: "PDF tools", hindi: "पीडीएफ टूल्स", description: "Open the PDF workspace for conversion, editing, and compression.", href: "/tools/pdf", icon: FileText, keywords: "document files tools" },
  { title: "Media downloader", hindi: "मीडिया डाउनलोडर", description: "Download public video and audio in available formats.", href: "/tools/universal-media-downloader", icon: ArrowUpRight, keywords: "video audio URL media quick tools" },
  { title: "My documents", hindi: "मेरे दस्तावेज़", description: "Open your document dashboard.", href: "/dashboard", icon: FileText, keywords: "saved files recent work biodata" },
  { title: "Images to PDF", hindi: "इमेज से पीडीएफ", description: "Convert JPG, PNG, and WebP images into a PDF.", href: "/tools/image-to-pdf-converter", icon: FileText, keywords: "picture photo scan" },
  { title: "Image to PDF", hindi: "इमेज से पीडीएफ", description: "Create a PDF from image files.", href: "/tools/image-to-pdf-converter", icon: FileText, keywords: "picture photo scan" },
  { title: "Word & Excel to PDF", hindi: "वर्ड और एक्सेल से पीडीएफ", description: "Convert DOCX and XLSX files to PDF.", href: "/tools/word-excel-to-pdf", icon: FileText, keywords: "spreadsheet office document" },
  { title: "PowerPoint to PDF", hindi: "पावरपॉइंट से पीडीएफ", description: "Convert PPTX slides to PDF pages.", href: "/tools/ppt-to-pdf", icon: FileText, keywords: "presentation slides" },
  { title: "Text to PDF", hindi: "टेक्स्ट से पीडीएफ", description: "Create a paginated PDF from a text file.", href: "/tools/text-to-pdf-converter", icon: FileText, keywords: "txt plain text" },
  { title: "Merge PDF files", hindi: "पीडीएफ फाइलें जोड़ें", description: "Combine multiple PDF documents in order.", href: "/tools/merge-pdf-files", icon: FileText, keywords: "join combine merge quick tools pdf merge" },
  { title: "PDF merge", hindi: "पीडीएफ मर्ज", description: "Combine PDF files.", href: "/tools/merge-pdf-files", icon: FileText, keywords: "join combine quick tools" },
  { title: "Split PDF pages", hindi: "पीडीएफ पेज अलग करें", description: "Extract page ranges or split a PDF into pages.", href: "/tools/split-pdf-pages", icon: FileText, keywords: "extract separate divide quick tools pdf split" },
  { title: "PDF split", hindi: "पीडीएफ स्प्लिट", description: "Split a PDF document into smaller files.", href: "/tools/split-pdf-pages", icon: FileText, keywords: "extract separate divide quick tools" },
  { title: "PDF compressor", hindi: "पीडीएफ कंप्रेसर", description: "Compress a PDF to a strict KB target; pages are flattened.", href: "/tools/compress-pdf-to-target-kb", icon: FileText, keywords: "compress to target KB reduce file size exam upload quick tools" },
  { title: "Standard PDF compression", hindi: "सामान्य पीडीएफ कंप्रेशन", description: "Optimize PDF size without rasterizing pages.", href: "/tools/pdf-compress", icon: FileText, keywords: "compress optimize" },
  { title: "PDF editor", hindi: "पीडीएफ एडिटर", description: "Edit and organize PDF pages.", href: "/tools/pdf-editor", icon: FileText, keywords: "edit organize pages" },
  { title: "Translate a PDF", hindi: "पीडीएफ का अनुवाद करें", description: "Translate text in a PDF document.", href: "/tools/translate-pdf-document", icon: FileText, keywords: "language translation" },
  { title: "Sign a PDF", hindi: "पीडीएफ पर हस्ताक्षर करें", description: "Add a drawn, typed, or uploaded signature to a PDF.", href: "/tools/sign-pdf-online", icon: FileText, keywords: "signature e-sign sign document quick tools" },
  { title: "Watermark PDF", hindi: "पीडीएफ वॉटरमार्क", description: "Add a text watermark to PDF pages.", href: "/tools/pdf-watermark", icon: FileText, keywords: "stamp mark" },
  { title: "Email templates", hindi: "ईमेल टेम्पलेट", description: "Browse ready-to-edit workplace email templates.", href: "/tools/corporate-email-format", icon: Mail, keywords: "out of office leave resignation appraisal" },
  ...emailTemplates.map((template): SearchItem => ({ title: template.name, hindi: template.name, description: `${template.category}: ${template.description}`, href: "/tools/corporate-email-format", icon: Mail, keywords: `template ${template.category} email` })),
];

const copy = {
  en: { getStarted: "GET STARTED", tools: "Tools for your next thing", quickTools: "QUICK TOOLS", search: "Search tools and documents", noResults: "No matching tools yet", language: "Language" },
  hi: { getStarted: "शुरू करें", tools: "आपके अगले काम के लिए टूल्स", quickTools: "त्वरित टूल्स", search: "टूल्स और दस्तावेज़ खोजें", noResults: "कोई मिलान नहीं मिला", language: "भाषा" },
};

export default function Home() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("eCyberCafe-language");
    return saved === "hi" ? "hi" : "en";
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const text = copy[language];

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryFromUrl = params.get("q");
    if (!queryFromUrl?.trim() && params.get("search") !== "1") return;
    const timeout = window.setTimeout(() => {
      if (queryFromUrl?.trim()) setQuery(queryFromUrl);
      setSearchOpen(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    const openMobileNav = () => setMobileNavOpen(true);
    const changeLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<"en" | "hi">).detail;
      if (nextLanguage === "en" || nextLanguage === "hi") setLanguage(nextLanguage);
    };
    window.addEventListener("ecybercafe:open-search", openSearch);
    window.addEventListener("ecybercafe:open-mobile-nav", openMobileNav);
    window.addEventListener("ecybercafe:language-change", changeLanguage);
    return () => {
      window.removeEventListener("ecybercafe:open-search", openSearch);
      window.removeEventListener("ecybercafe:open-mobile-nav", openMobileNav);
      window.removeEventListener("ecybercafe:language-change", changeLanguage);
    };
  }, []);
  const normalizedQuery = query.trim().toLowerCase();
  const results = searchItems.filter((item) => `${item.title} ${item.hindi} ${item.description} ${item.keywords ?? ""}`.toLowerCase().includes(normalizedQuery));

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`} style={{ zIndex: mobileNavOpen ? 50 : undefined }}>
        <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        <div className="workspace-label">{text.quickTools}</div>
        <nav className="nav-list">
          {quickTools.map(({ label, hindi, icon: Icon, href }) => <a key={label} className="nav-item" href={href} onClick={() => setMobileNavOpen(false)}><Icon size={17} strokeWidth={1.8} />{language === "hi" ? hindi : label}</a>)}
        </nav>
      </aside>

      {mobileNavOpen && <button className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}

      <section className="main-content">
        <div className="content-wrap">
          <AdBannerSlot slotId="home-leaderboard" format="leaderboard" className="mb-8" />
          <section className="section-block !mt-0" aria-labelledby="home-heading">
            <p className="eyebrow">Free online tools</p>
            <h1 id="home-heading" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              PDF, photo and document tools for everyday tasks
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              DigiCyberCafe is an independent online utility site operated from
              Patna, India. Create and prepare documents, resize exam photos,
              work with PDFs, and use practical tools for office and daily tasks.
              Supported file workflows run in your browser; each tool explains
              its own processing and privacy limits.
            </p>
          </section>
          <section id="tools" className="section-block !mt-0">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{text.getStarted}</p>
                <h2>{text.tools}</h2>
              </div>
            </div>
            <div className="tools-grid">
              {tools.map(({ title, description, icon: Icon, color, href }) => (
                <a className="tool-card" href={href} key={title}>
                  <div className={`tool-icon ${color}`}><Icon size={21} strokeWidth={1.8} /></div>
                  <div className="tool-card-copy">
                    <h3>{language === "hi" ? searchItems.find((item) => item.title === title)?.hindi : title}</h3>
                    <p>{description}</p>
                  </div>
                  <ArrowUpRight className="card-arrow" size={18} />
                </a>
              ))}
            </div>
          </section>
          <section className="section-block" aria-labelledby="home-faq-heading">
            <h2 id="home-faq-heading" className="text-2xl font-semibold tracking-tight text-slate-900">
              About DigiCyberCafe
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-900">Are DigiCyberCafe tools free?</h3>
                <p className="mt-1 leading-6 text-slate-600">
                  Many tools are free to use. Check the individual tool for any
                  feature limits, account requirements, or third-party services.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Are my files uploaded?</h3>
                <p className="mt-1 leading-6 text-slate-600">
                  It depends on the tool. Some process files in your browser;
                  others use server-side services. Review the privacy note on
                  the tool you choose.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Is DigiCyberCafe a government website?</h3>
                <p className="mt-1 leading-6 text-slate-600">
                  No. DigiCyberCafe is an independent project, not a government
                  agency or exam authority. Always follow the current official
                  instructions for applications and eligibility.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Where is DigiCyberCafe operated?</h3>
                <p className="mt-1 leading-6 text-slate-600">
                  DigiCyberCafe is operated from Patna, Bihar, India. Its online
                  tools are available to users beyond that location.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
      {searchOpen && <div className="search-scrim" onMouseDown={() => setSearchOpen(false)}><section className="search-dialog" onMouseDown={(event) => event.stopPropagation()}><div className="search-input-wrap"><Search size={18} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && results[0]) router.push(results[0].href); }} placeholder={text.search} /><kbd>ESC</kbd></div><div className="search-results max-h-[min(65vh,520px)] overflow-y-auto">{results.length ? results.map(({ title, hindi, description, href, icon: Icon }) => <a className="search-result no-underline" key={`${href}-${title}`} href={href} onClick={() => setSearchOpen(false)}><span className="search-result-icon"><Icon size={17} /></span><span><strong>{language === "hi" ? hindi : title}</strong><small>{description}</small></span><ArrowUpRight size={16} /></a>) : <p className="search-empty">{text.noResults}</p>}</div></section></div>}
    </main>
  );
}
