export type PublicToolCategory =
  | "PDF and document tools"
  | "Photo and image tools"
  | "Business and everyday tools";

export const publicToolDirectory = [
  {
    path: "/tools/pdf",
    name: "PDF tools",
    description: "Browse PDF conversion, merging, splitting, compression, editing, signing, and watermarking.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/merge-pdf-files",
    name: "Merge PDF files",
    description: "Combine selected PDF files into one document and review their order.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/split-pdf-pages",
    name: "Split PDF pages",
    description: "Extract selected pages or page ranges into separate PDF files.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/compress-pdf-to-target-kb",
    name: "Compress PDF to a target size",
    description: "Rasterize PDF pages to approach a chosen file-size limit; text will not remain selectable.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/pdf-compress",
    name: "Standard PDF compression",
    description: "Optimize a PDF without rasterizing its pages; file-size reduction varies by document.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/pdf-editor",
    name: "PDF editor",
    description: "Add supported text overlays or cover shapes to a PDF and inspect the export.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/pdf-watermark",
    name: "PDF watermark",
    description: "Add a text watermark to PDF pages and review the result before sharing.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/image-to-pdf-converter",
    name: "Images to PDF",
    description: "Convert supported JPG, PNG, and WebP images into a PDF.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/word-excel-to-pdf",
    name: "Word and Excel to PDF",
    description: "Convert supported Office documents to PDF and review the exported pages.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/ppt-to-pdf",
    name: "PowerPoint to PDF",
    description: "Convert supported PowerPoint presentations to PDF.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/text-to-pdf-converter",
    name: "Text to PDF",
    description: "Create a paginated PDF from plain text and check page breaks.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/sign-pdf-online",
    name: "Sign PDF",
    description: "Place a visual signature in a PDF; check recipient rules for electronic signatures.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/translate-pdf-document",
    name: "Translate PDF",
    description: "Translate extracted PDF text after reviewing the tool's third-party processing notice.",
    category: "PDF and document tools",
  },
  {
    path: "/tools/target-kb-file-resizer",
    name: "Image and PDF target-size resizer",
    description: "Resize supported images or PDFs toward an upload limit and verify the actual output.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/passport-photo-maker",
    name: "Passport and visa photo maker",
    description: "Crop a portrait to selected photo dimensions; verify the destination's current rules.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/photo-name-date-generator",
    name: "Exam photo name and date maker",
    description: "Add candidate name and date details to a photo using the available presets.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/image-background-remover",
    name: "Image background remover",
    description: "Remove or replace an image background using the supported browser workflow.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/photo-enhancer-online",
    name: "Photo enhancer",
    description: "Adjust and enhance a photo, then review the exported image.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/id-card-front-back-joiner",
    name: "ID card front and back joiner",
    description: "Arrange both sides of an ID card on a printable sheet.",
    category: "Photo and image tools",
  },
  {
    path: "/tools/barcode-qr-generator",
    name: "Barcode and QR code generator",
    description: "Generate supported barcode and QR formats and test the exported image.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/free-invoice-generator",
    name: "Invoice and quotation generator",
    description: "Prepare an invoice or quotation and review totals and tax details before sharing.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/hra-rent-receipt-generator",
    name: "HRA rent receipt generator",
    description: "Prepare printable rent receipts and check them against actual payment records.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/corporate-email-format",
    name: "Corporate email templates",
    description: "Draft editable workplace messages for common professional situations.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/mutual-fund-sip-lumpsum-calculator",
    name: "Mutual fund SIP and lumpsum calculator",
    description: "Estimate investment growth using assumptions; projections are not guaranteed returns.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/sarkari-exam-age-calculator",
    name: "Exam age and eligibility calculator",
    description: "Calculate age on a specified date and review exam eligibility details.",
    category: "Business and everyday tools",
  },
  {
    path: "/tools/video-compressor-reduce-size",
    name: "Video compressor",
    description: "Compress a supported video in the browser and compare its output size.",
    category: "Business and everyday tools",
  },
  {
    path: "/builder/biodata",
    name: "Marriage biodata maker",
    description: "Create and export a marriage biodata profile.",
    category: "Business and everyday tools",
  },
] as const;
