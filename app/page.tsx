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
  Video,
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
    title: "Video Compressor",
    description: "Compress videos privately in your browser and check the exact size reduction.",
    icon: Video,
    color: "blue",
    href: "/tools/video-compressor-reduce-size",
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
  { label: "Video compressor", hindi: "वीडियो कंप्रेसर", icon: Video, href: "/tools/video-compressor-reduce-size" },
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
  { title: "Calculate age & experience", hindi: "सरकारी परीक्षा आयु कैलकुलेटर", description: "Calculate exact age for government exam eligibility or work experience between two dates.", href: "/tools/sarkari-exam-age-calculator", icon: CalendarDays, keywords: "Sarkari exam age calculator work experience duration years months days UPSC SSC railway age cutoff date of birth eligibility age relaxation" },
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
  { title: "Video Compressor", hindi: "वीडियो कंप्रेसर", description: "Compress a video locally and check its exact output size and percentage change.", href: "/tools/video-compressor-reduce-size", icon: Video, keywords: "video reduce file size compress resize resolution scale mp4 locally private" },
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
  en: { getStarted: "GET STARTED", tools: "Free Online Document, PDF & Photo Tools", quickTools: "QUICK TOOLS", search: "Search tools and documents", noResults: "No matching tools yet", language: "Language" },
  hi: { getStarted: "शुरू करें", tools: "मुफ़्त ऑनलाइन दस्तावेज़, PDF और फोटो टूल्स", quickTools: "त्वरित टूल्स", search: "टूल्स और दस्तावेज़ खोजें", noResults: "कोई मिलान नहीं मिला", language: "भाषा" },
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
          <section id="tools" className="section-block !mt-0" aria-labelledby="home-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{text.getStarted}</p>
                <h1 id="home-heading" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {text.tools}
                </h1>
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
          <section className="section-block home-guide" aria-labelledby="home-guide-heading">
            <h2 id="home-guide-heading" className="mb-3 text-2xl font-medium text-slate-900">
              Useful online tools for documents, PDFs, photos, and applications
            </h2>
            <p className="mb-8 max-w-4xl leading-7 text-slate-600">
              DigiCyberCafe provides free in-browser document, PDF, and photo tools for everyday office work and online applications. Find a photo utility, prepare a PDF, create a document, or use a calculator from one place. Choose a tool above to see its supported file types, options, and instructions. The tools are designed to help with common preparation tasks; always check the requirements of the organization or website where you plan to submit a file.
            </p>

            <div className="grid gap-7 md:grid-cols-2">
              <article>
                <h3 className="mb-2 text-lg font-medium text-slate-900">Resize and prepare application photos</h3>
                <p className="leading-7 text-slate-600">
                  Photo tools can help crop a portrait, adjust its dimensions, reduce an image toward a file-size limit, or add a candidate name and date where a form asks for them. Passport and visa photo requirements are different across countries and application systems. Use the destination&apos;s current instructions for the required size, background, format, and file limit, then review the exported image at full size before uploading it. A resizer can prepare a file, but it cannot confirm that a photo meets every official rule.
                </p>
              </article>
              <article>
                <h3 className="mb-2 text-lg font-medium text-slate-900">Merge, split, compress, and sign PDFs</h3>
                <p className="leading-7 text-slate-600">
                  PDF utilities help organize pages, combine selected documents, extract a page range, add a watermark, or reduce file size for an upload. Some workflows also let you place a visual signature or convert supported documents into PDF pages. Check page order, legibility, and the final file size after export. A drawn or typed signature is a visual mark and does not provide a cryptographic certificate or verify the signer&apos;s identity.
                </p>
              </article>
              <article>
                <h3 className="mb-2 text-lg font-medium text-slate-900">Create everyday office documents</h3>
                <p className="leading-7 text-slate-600">
                  Use the invoice and quotation maker to prepare a printable business document, the rent receipt tool to create monthly records, or the email format tool to draft workplace messages. The biodata builder helps organize profile information into an exportable document. Review names, dates, amounts, tax details, and other entries carefully before sharing or relying on an export. These tools help with formatting; they do not replace professional accounting, legal, or tax advice.
                </p>
              </article>
              <article>
                <h3 className="mb-2 text-lg font-medium text-slate-900">Use calculators and image utilities</h3>
                <p className="leading-7 text-slate-600">
                  The age and eligibility calculator can help you compare dates with the criteria you enter, while the mutual fund calculator illustrates possible growth from chosen assumptions. Investment projections are estimates, not guaranteed returns or financial advice, and exam eligibility must be checked against the relevant official notification. Image utilities can also help join ID card sides for printing, improve a photo, remove a background, or generate a barcode or QR code for supported information.
                </p>
              </article>
            </div>

            <div className="mt-9">
              <h2 className="mb-3 text-2xl font-medium text-slate-900">How to use an in-browser tool</h2>
              <ol className="grid list-inside list-decimal gap-2 leading-7 text-slate-600 sm:grid-cols-2">
                <li>Open the tool that matches your task and read its format and privacy notes.</li>
                <li>Select a file or enter the details the tool requests, then choose the available settings.</li>
                <li>Preview the result and correct any pages, dimensions, text, or values that need attention.</li>
                <li>Export the file and verify it against the destination&apos;s rules before submitting or sharing.</li>
              </ol>
            </div>

            <div className="mt-9">
              <h2 className="mb-3 text-2xl font-medium text-slate-900">Privacy and file handling</h2>
              <p className="max-w-4xl leading-7 text-slate-600">
                Processing depends on the tool: many file operations run in your browser, while some features may contact a service or download required assets. Read the privacy note on the individual tool before selecting sensitive files; do not assume every tool uses the same processing method. Keep exported identity documents and financial records somewhere secure, and remove copies from shared devices when you are finished. For details about site data and account features, read the Privacy Policy linked in the site footer.
              </p>
            </div>

            <div className="mt-9">
              <h2 className="mb-3 text-2xl font-medium text-slate-900">Common questions</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <article>
                  <h3 className="mb-1 font-medium text-slate-900">Will every tool make my file meet an application&apos;s rules?</h3>
                  <p className="leading-7 text-slate-600">
                    No. Tools can help adjust or organize a file, but each application sets its own current requirements. Check those instructions and inspect the final file before submitting it.
                  </p>
                </article>
                <article>
                  <h3 className="mb-1 font-medium text-slate-900">Are files always processed only on my device?</h3>
                  <p className="leading-7 text-slate-600">
                    Processing varies by feature. Check the privacy details shown on the specific tool page for information about local processing, downloaded assets, or services it uses.
                  </p>
                </article>
                <article>
                  <h3 className="mb-1 font-medium text-slate-900">How do I know if a compressed file is small enough?</h3>
                  <p className="leading-7 text-slate-600">
                    Check the exported file&apos;s actual size and confirm that its pages or image remain readable. Compression results depend on the source file and selected settings.
                  </p>
                </article>
                <article>
                  <h3 className="mb-1 font-medium text-slate-900">Can I rely on a calculator result as an official decision?</h3>
                  <p className="leading-7 text-slate-600">
                    No. Calculators provide estimates based on the information and assumptions entered. Confirm eligibility with the official notice and discuss financial decisions with a qualified adviser.
                  </p>
                </article>
              </div>
            </div>
          </section>
        </div>
      </section>
      {searchOpen && <div className="search-scrim" onMouseDown={() => setSearchOpen(false)}><section className="search-dialog" onMouseDown={(event) => event.stopPropagation()}><div className="search-input-wrap"><Search size={18} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && results[0]) router.push(results[0].href); }} placeholder={text.search} /><kbd>ESC</kbd></div><div className="search-results max-h-[min(65vh,520px)] overflow-y-auto">{results.length ? results.map(({ title, hindi, description, href, icon: Icon }) => <a className="search-result no-underline" key={`${href}-${title}`} href={href} onClick={() => setSearchOpen(false)}><span className="search-result-icon"><Icon size={17} /></span><span><strong>{language === "hi" ? hindi : title}</strong><small>{description}</small></span><ArrowUpRight size={16} /></a>) : <p className="search-empty">{text.noResults}</p>}</div></section></div>}
    </main>
  );
}
