import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

export type ToolAeoContent = {
  name: string;
  path: string;
  title: string;
  description: string;
  steps: ToolHowToStep[];
  specifications: { label: string; value: string }[];
  privacy: string;
  faqs: ToolFaq[];
};

export const toolAeoContent = {
  "barcode-qr-generator": {
    name: "Barcode and QR Code Generator",
    path: "/tools/barcode-qr-generator",
    title: "Create a QR code or barcode in your browser",
    description:
      "Create a downloadable QR code for text, Wi-Fi, UPI, or contact details, or generate a Code 128, EAN-13, UPC-A, or Code 39 barcode.",
    steps: [
      { name: "Choose a code type", text: "Select QR code or barcode, then choose the matching content type or barcode standard." },
      { name: "Enter and style the data", text: "Add the value and adjust available colors, dimensions, or QR error-correction settings; fix any validation message." },
      { name: "Download the image", text: "Preview the generated code and export it as a PNG when it scans or prints as intended." },
    ],
    specifications: [
      { label: "QR content", value: "Text or URL, Wi-Fi, UPI, and vCard contact details" },
      { label: "Barcode formats", value: "Code 128, EAN-13, UPC-A, and Code 39" },
      { label: "Export", value: "PNG image; QR and barcode exports are rendered at 2000 px wide" },
    ],
    privacy:
      "Code generation and logo-image handling run in the browser. A QR code can visibly encode personal or payment details, so review its content before sharing the exported image.",
    faqs: [
      { question: "Can I create a QR code for Wi-Fi or UPI?", answer: "Yes. Choose Wi-Fi or UPI, enter the requested details, then test the downloaded QR code with a scanner before publishing it." },
      { question: "Which barcode formats are available?", answer: "The generator supports Code 128, EAN-13, UPC-A, and Code 39, with input validation for the selected format." },
      { question: "Why should I test a QR code before printing?", answer: "Contrast, size, a center logo, and the printed surface can affect scanning. Test the exported image on multiple devices at its intended size." },
    ],
  },
  "compress-pdf-to-target-kb": {
    name: "PDF Target-Size Compressor",
    path: "/tools/compress-pdf-to-target-kb",
    title: "Reduce a PDF to a chosen maximum size",
    description:
      "The target-size PDF compressor rasterizes pages and adjusts image quality to approach a user-entered maximum file size; the achieved size and readability depend on the source PDF.",
    steps: [
      { name: "Select a PDF", text: "Choose a PDF from your device and confirm that its page preview loads." },
      { name: "Set the maximum size", text: "Enter a target of at least 10 KB. The initial value is 200 KB; use the limit specified by your destination." },
      { name: "Compress and inspect", text: "Run compression, compare the displayed output size and page preview, then download only if it remains readable." },
    ],
    specifications: [
      { label: "Input", value: "One PDF file" },
      { label: "Target", value: "User-entered maximum in KB; minimum accepted value is 10 KB" },
      { label: "Output trade-off", value: "Pages are rasterized; selectable text is not retained" },
    ],
    privacy:
      "The selected PDF is processed by a browser Web Worker on this device. The resulting pages are raster images, so inspect legibility and verify the output against the receiving portal's rules.",
    faqs: [
      { question: "Will the output always meet the requested KB limit?", answer: "The tool attempts to meet the entered target, but compression can fail when the target is too small for the document. Check the reported final size rather than assuming a target was met." },
      { question: "Can I search or copy text from the compressed PDF?", answer: "No. This target-size workflow rasterizes pages, so text is no longer selectable or searchable in the output." },
      { question: "Does a 100 KB setting guarantee acceptance by an exam portal?", answer: "No. Portals can impose separate page, format, and size rules. Check the current official instructions and the final output file before submitting." },
    ],
  },
  "corporate-email-format": {
    name: "Corporate Email Template Generator",
    path: "/tools/corporate-email-format",
    title: "Draft a professional workplace email",
    description:
      "Build an editable workplace email from templates for out-of-office replies, leave requests, resignation notices, and other common office messages.",
    steps: [
      { name: "Choose a template", text: "Select the workplace email type that best matches your purpose." },
      { name: "Fill in relevant details", text: "Complete the fields shown for the chosen template and review the live subject and message preview." },
      { name: "Copy or open your mail app", text: "Copy the subject and body separately, or open a configured email application using the optional recipient address." },
    ],
    specifications: [
      { label: "Templates", value: "Workplace messages including out-of-office, leave, resignation, and appraisal requests" },
      { label: "Output", value: "Editable subject and message text" },
      { label: "Actions", value: "Copy subject/body or open a mail client with a mailto link" },
    ],
    privacy:
      "Template text is assembled in the current browser page. If you open a mail client, the subject and message are passed to that client; review the recipient and contents before sending.",
    faqs: [
      { question: "Does the tool send the email for me?", answer: "No. It generates a draft. You can copy its text or open a mail application, where you must review and send the message yourself." },
      { question: "Can I edit the generated email?", answer: "Yes. The preview is based on your selected template and entered details; copy it into your mail client and make any final edits before sending." },
      { question: "Why did the mail app not open?", answer: "The device may not have a default email application configured, or the browser may block the mailto action. Use the copy buttons and paste the draft manually." },
    ],
  },
  "image-to-pdf-converter": {
    name: "Image to PDF Converter",
    path: "/tools/image-to-pdf-converter",
    title: "Turn images into a PDF document",
    description:
      "Convert selected JPG, JPEG, PNG, or WebP images into a PDF, with one image per page in the order shown in the file list.",
    steps: [
      { name: "Choose images", text: "Select one or more JPG, JPEG, PNG, or WebP files from your device." },
      { name: "Arrange and choose a layout", text: "Reorder the images as needed, then select A4 with margins or fit-page layout." },
      { name: "Create and review the PDF", text: "Create the PDF, check the page preview, and download the file." },
    ],
    specifications: [
      { label: "Input formats", value: "JPG/JPEG, PNG, and WebP" },
      { label: "Page arrangement", value: "One image per PDF page, following the selected order" },
      { label: "Layouts", value: "A4 with margins or fit page to image" },
    ],
    privacy:
      "Image files are read and converted in the browser using local PDF and image APIs. The generated PDF is downloaded by your browser; avoid using shared devices for sensitive files.",
    faqs: [
      { question: "Can I combine several pictures into one PDF?", answer: "Yes. Select multiple supported images, arrange their order in the file list, and create one PDF with a page for each image." },
      { question: "What is the difference between A4 and fit-page layout?", answer: "A4 with margins places each image on an A4 page while fitting it within the margins. Fit-page makes each PDF page match the image dimensions." },
      { question: "Will the PDF be exactly the same size as my images?", answer: "Not necessarily. PDF encoding and the selected page layout affect output size and page dimensions; check the exported document before printing or submitting." },
    ],
  },
  "merge-pdf-files": {
    name: "PDF Merger",
    path: "/tools/merge-pdf-files",
    title: "Combine PDF files in a chosen order",
    description:
      "Merge two or more PDF files into one document by arranging the input files in the order their pages should appear.",
    steps: [
      { name: "Add PDFs", text: "Select at least two PDF files from your device." },
      { name: "Set the sequence", text: "Reorder the file list; each source PDF's pages are kept together in that sequence." },
      { name: "Merge and download", text: "Choose Merge PDFs and download the combined document after checking the file." },
    ],
    specifications: [
      { label: "Input", value: "Two or more PDF files" },
      { label: "Page order", value: "Files can be reordered; pages within each file retain their source order" },
      { label: "Output", value: "One combined PDF" },
    ],
    privacy:
      "PDF bytes are read and merged in the browser with pdf-lib; this tool does not send the selected PDF files to a server.",
    faqs: [
      { question: "Can I change the order of pages before merging?", answer: "The tool reorders whole input files, not individual pages. Arrange the documents in the desired sequence before merging." },
      { question: "Does merging reduce the PDF file size?", answer: "Merging combines documents; it is not a compression step. The output size depends on the source files." },
      { question: "Why might a PDF fail to merge?", answer: "The file may be damaged, encrypted in a way the browser library cannot read, or otherwise unsupported. Try opening a valid, unprotected PDF and run the operation again." },
    ],
  },
  pdf: {
    name: "PDF Tools Workspace",
    path: "/tools/pdf",
    title: "Choose the right PDF operation",
    description:
      "The PDF workspace links to separate tools for converting images and office files, merging or splitting pages, compressing, translating, signing, editing, and watermarking PDFs.",
    steps: [
      { name: "Choose an operation", text: "Select the PDF tool that matches your task from the workspace cards." },
      { name: "Review the tool's requirements", text: "Check its accepted input formats, processing notes, and any quality or content trade-offs." },
      { name: "Process and verify", text: "Use that tool's controls, then open the downloaded result and confirm it is suitable for your purpose." },
    ],
    specifications: [
      { label: "Available operations", value: "Conversion, merge, split, compression, translation, signing, editing, and watermarking" },
      { label: "Inputs", value: "Formats vary by operation; individual tools specify accepted files" },
      { label: "Data handling", value: "Processing varies by operation; translation sends extracted text to its provider after consent" },
    ],
    privacy:
      "The workspace is a directory, not a single processor. Most document operations run in the browser, while PDF translation sends extracted text to a translation provider after you consent. Review each tool's notice before use.",
    faqs: [
      { question: "Are all PDF tools processed the same way?", answer: "No. Most operations use browser-side processing, but translation sends extracted text to a provider after you explicitly consent. Some operations also change how text is represented in the output." },
      { question: "Which tool should I use to reduce a PDF to a portal limit?", answer: "Use the target-size compressor, enter the required maximum, then inspect its final size and readability. The target workflow rasterizes pages." },
      { question: "Can I edit existing PDF text with these tools?", answer: "The PDF editor adds text overlays or white cover shapes to the first page; it does not provide full editing of the original text layer." },
    ],
  },
  "pdf-compress": {
    name: "Standard PDF Compressor",
    path: "/tools/pdf-compress",
    title: "Optimize a PDF without rasterizing pages",
    description:
      "Standard PDF compression rewrites document objects and streams without rasterizing the pages; the size reduction depends on the source PDF.",
    steps: [
      { name: "Select a PDF", text: "Choose one PDF file and wait for the original page preview to appear." },
      { name: "Run standard compression", text: "Start compression to rewrite the PDF using object streams." },
      { name: "Compare and download", text: "Compare the displayed file sizes and previews; download the result if it meets your needs." },
    ],
    specifications: [
      { label: "Input", value: "One PDF file" },
      { label: "Method", value: "Rewrites PDF object streams without rasterizing pages" },
      { label: "Size change", value: "Varies by document; output can be similar in size or larger" },
    ],
    privacy:
      "The PDF is read and saved in the browser. The tool does not rasterize pages, but compression may produce little or no size reduction; compare the actual output.",
    faqs: [
      { question: "Will standard compression always make my PDF smaller?", answer: "No. The result depends on the file's existing structure and compression. The output can be similar in size or larger, so compare the displayed sizes." },
      { question: "Does this method keep text selectable?", answer: "It does not rasterize pages, so existing selectable page content is preserved where the PDF library supports it." },
      { question: "What if I need a strict file-size target?", answer: "Use the target-size compressor instead, but note that its rasterized output no longer contains selectable text and should be checked for readability." },
    ],
  },
  "pdf-editor": {
    name: "PDF Overlay Editor",
    path: "/tools/pdf-editor",
    title: "Add text or cover an area on a PDF page",
    description:
      "The PDF editor adds text overlays or white cover rectangles to the first page of a PDF and exports a copy with those edits applied.",
    steps: [
      { name: "Open a PDF", text: "Choose a PDF and check the first-page editing workspace." },
      { name: "Add an overlay", text: "Enter text and add it, or add a white rectangle over an area; position overlays in the preview." },
      { name: "Export and inspect", text: "Export the edited PDF and verify the resulting first page before sharing it." },
    ],
    specifications: [
      { label: "Input", value: "One PDF file" },
      { label: "Editable page", value: "First page only" },
      { label: "Operations", value: "Add text overlays or white cover shapes" },
    ],
    privacy:
      "The selected PDF is processed in the browser. A white cover shape is a visual overlay, not secure redaction: underlying content may remain in the PDF and could be recoverable.",
    faqs: [
      { question: "Does covering text remove it from the PDF?", answer: "No. The cover operation adds a white rectangle over the first-page content; it does not securely remove the underlying text or data. Do not use it for redacting sensitive information." },
      { question: "Can I edit text on every page?", answer: "No. This editor applies its text and cover overlays to the first page only." },
      { question: "Will the original PDF be overwritten?", answer: "The tool creates a downloadable edited copy; keep the original if you may need it." },
    ],
  },
  "pdf-watermark": {
    name: "PDF Text Watermark Tool",
    path: "/tools/pdf-watermark",
    title: "Add a text watermark to every PDF page",
    description:
      "Add a light, diagonal text watermark across each page of a PDF and export the watermarked document.",
    steps: [
      { name: "Choose a PDF", text: "Select a PDF from your device." },
      { name: "Enter watermark text", text: "Replace the default watermark with the wording you want displayed." },
      { name: "Export and review", text: "Export the PDF and inspect several pages to confirm the watermark is legible and positioned as expected." },
    ],
    specifications: [
      { label: "Input", value: "One PDF file" },
      { label: "Watermark", value: "Text applied to every page at a light opacity and diagonal angle" },
      { label: "Output", value: "A downloadable PDF copy" },
    ],
    privacy:
      "The selected PDF is processed in the browser using pdf-lib, then downloaded to your device. The watermark is visible page content, not a digital rights-management control.",
    faqs: [
      { question: "Does the watermark appear on every page?", answer: "Yes. The tool writes the watermark text on each page in the PDF." },
      { question: "Does a watermark prevent copying or editing?", answer: "No. A visual watermark can identify or label a document, but it does not encrypt the file or prevent copying, editing, or removal." },
      { question: "Can I change watermark placement or opacity?", answer: "The current tool accepts watermark text; placement and opacity are preset rather than user-adjustable." },
    ],
  },
  "photo-enhancer-online": {
    name: "Photo Enhancer and Upscaler",
    path: "/tools/photo-enhancer-online",
    title: "Adjust and upscale an image in your browser",
    description:
      "Enhance a photo with browser-based brightness, exposure, color, contrast, denoise, and sharpening controls, compare it with the original, and export an adjusted image.",
    steps: [
      { name: "Choose an image", text: "Open a supported photo and wait for its preview to load." },
      { name: "Adjust and compare", text: "Tune the controls, use the comparison slider, and inspect the image at 100% or 200%." },
      { name: "Choose output settings", text: "Select an available export format and quality, then download the result; use 2x upscale only when larger dimensions are useful." },
    ],
    specifications: [
      { label: "Adjustments", value: "Brightness, exposure, color/vibrance, contrast, denoise, and sharpening controls" },
      { label: "Upscaling", value: "Optional 2x resampling; it enlarges pixels but cannot restore missing source detail" },
      { label: "Export", value: "JPEG, PNG, or WebP; quality control applies to JPEG and WebP" },
    ],
    privacy:
      "The selected photo is decoded in the browser and pixel processing runs in a local Web Worker; the source photo is not sent to a server. Very large images may require local downscaling to fit browser memory limits.",
    faqs: [
      { question: "Does 2x upscaling add real detail?", answer: "No. It resamples the image to twice its width and height, but cannot recover details absent from the original." },
      { question: "Why can strong sharpening make a photo look worse?", answer: "Aggressive sharpening or contrast can amplify grain and clip highlights. Use the comparison preview and make smaller adjustments if the result looks harsh." },
      { question: "Which image formats can I export?", answer: "The tool exports JPEG, PNG, or WebP. JPEG and WebP have a quality setting; PNG uses lossless encoding." },
    ],
  },
  "ppt-to-pdf": {
    name: "PowerPoint to PDF Converter",
    path: "/tools/ppt-to-pdf",
    title: "Convert a PPTX presentation into PDF pages",
    description:
      "Render a .pptx presentation in the browser and create a PDF with one page per slide; legacy .ppt files are not supported.",
    steps: [
      { name: "Select a PPTX file", text: "Choose a modern .pptx presentation from your device; .ppt files are not accepted." },
      { name: "Preview slides", text: "Wait for the presentation to load, then use the slide controls to inspect it." },
      { name: "Convert and review", text: "Convert the slides to a PDF and check the exported pages, fonts, and visual effects before sharing." },
    ],
    specifications: [
      { label: "Accepted input", value: "PPTX only; legacy PPT format is unsupported" },
      { label: "Page mapping", value: "One PDF page per rendered slide" },
      { label: "Rendering trade-off", value: "Slides are exported as images; text is not selectable and some fonts, effects, or media may differ" },
    ],
    privacy:
      "The presentation is read and rendered in the browser, and the PDF is assembled on this device. Conversion rasterizes slides; inspect the result because some PowerPoint features may not reproduce exactly.",
    faqs: [
      { question: "Can I convert an old .ppt file?", answer: "No. The converter accepts .pptx presentations. Save the presentation as .pptx in presentation software before using this tool." },
      { question: "Will text in the converted PDF be selectable?", answer: "No. Each slide is rendered as an image and placed on a PDF page." },
      { question: "Why do fonts or animations look different?", answer: "The browser renderer may not reproduce every embedded font, transition, media item, or presentation effect. Review every exported page before relying on it." },
    ],
  },
  "sign-pdf-online": {
    name: "PDF Signature Placement Tool",
    path: "/tools/sign-pdf-online",
    title: "Place a drawn, typed, or image signature on a PDF",
    description:
      "Add a drawn, typed, or uploaded signature image to a selected page of a PDF, position it in the preview, and export a signed copy.",
    steps: [
      { name: "Choose a PDF", text: "Open the document and navigate to the page that should display the signature." },
      { name: "Create a signature", text: "Draw a signature, type a name, or upload an ink-signature image, then position and resize it." },
      { name: "Download and verify", text: "Download the updated PDF and confirm the signature appears on the intended page." },
    ],
    specifications: [
      { label: "Input", value: "One PDF and a drawn, typed, or uploaded signature image" },
      { label: "Placement", value: "A signature image can be positioned and resized on the selected page" },
      { label: "Signature type", value: "Visual signature mark; not a certificate-based cryptographic digital signature" },
    ],
    privacy:
      "The PDF and signature image are processed in the browser and exported locally. This adds a visual mark; it does not apply a cryptographic certificate or verify a signer's identity.",
    faqs: [
      { question: "Is this a legally verified digital signature?", answer: "The tool places a visual signature mark in the PDF; it does not create or validate a certificate-based cryptographic signature. Check the recipient's requirements for an accepted signing method." },
      { question: "Can I move or resize the signature?", answer: "Yes. Position and resize the signature image in the page preview before downloading." },
      { question: "Does it alter every page?", answer: "No. The signature is added to the selected page. Navigate to the intended page before exporting." },
    ],
  },
  "split-pdf-pages": {
    name: "PDF Page Splitter",
    path: "/tools/split-pdf-pages",
    title: "Extract selected pages or split a PDF into separate files",
    description:
      "Select pages from a PDF and export them as separate files; selecting multiple pages creates a ZIP archive of PDFs.",
    steps: [
      { name: "Open a PDF", text: "Choose a PDF and let the tool load its page count." },
      { name: "Select pages", text: "Use the page checkboxes to select the pages to extract; deselect pages you do not need." },
      { name: "Create and download", text: "Run the split operation, review the generated files, and download the PDF or ZIP archive." },
    ],
    specifications: [
      { label: "Input", value: "One PDF file" },
      { label: "Selection", value: "Choose pages from the loaded document" },
      { label: "Output", value: "One selected page downloads as a PDF; multiple selected pages are provided as a ZIP of PDFs" },
    ],
    privacy:
      "The PDF is read and split in the browser with pdf-lib. Output files are generated locally; verify page order and contents before sharing.",
    faqs: [
      { question: "Can I extract a range of PDF pages?", answer: "Yes. Select each desired page in the page list before running the split operation." },
      { question: "Why is the download a ZIP file?", answer: "When multiple pages are selected, the tool creates separate one-page PDF files and packages them in a ZIP archive." },
      { question: "Does splitting modify the original file?", answer: "No. It creates new output files and leaves the selected source file unchanged." },
    ],
  },
  "text-to-pdf-converter": {
    name: "Text File to PDF Converter",
    path: "/tools/text-to-pdf-converter",
    title: "Create a paginated PDF from text",
    description:
      "Convert pasted text or a .txt file into an A4 PDF with automatic line wrapping, a selected font size, and page numbering.",
    steps: [
      { name: "Enter or load text", text: "Paste text into the editor or choose a .txt file." },
      { name: "Set the font size", text: "Choose one of the available point sizes and review the text before conversion." },
      { name: "Create and inspect the PDF", text: "Generate the PDF, check page breaks and characters, then download the result." },
    ],
    specifications: [
      { label: "Input", value: "Pasted text or .txt file" },
      { label: "Page format", value: "A4 with automatic line wrapping and pagination" },
      { label: "Font size", value: "9, 10, 11, 12, 14, or 16 pt" },
    ],
    privacy:
      "Text is converted to PDF in the browser and is not sent to a server by this tool. Its built-in PDF font has limited character coverage; inspect non-Latin characters in the output.",
    faqs: [
      { question: "Can I convert a long text file?", answer: "Yes. The converter wraps text and adds pages as needed, with page numbers in the resulting PDF." },
      { question: "Why are some non-English characters missing?", answer: "The built-in standard PDF font has limited character coverage. Check the generated file and use a font or workflow that supports the required script if characters are missing." },
      { question: "Can I adjust the page layout?", answer: "The current converter uses an A4 page with fixed margins; the available setting changes font size." },
    ],
  },
  "translate-pdf-document": {
    name: "PDF Text Translator",
    path: "/tools/translate-pdf-document",
    title: "Translate selectable text from a PDF",
    description:
      "Extract selectable text from a PDF, translate it between supported languages after consent, review or edit the translated text, and export a rebuilt PDF.",
    steps: [
      { name: "Choose a text-based PDF", text: "Open a PDF with selectable text. Scanned pages need OCR before this tool can extract their words." },
      { name: "Choose languages and consent", text: "Set the source and target languages, then confirm that extracted text may be sent to MyMemory for translation." },
      { name: "Review and export", text: "Review or edit the translated pages, then create and download the rebuilt PDF." },
    ],
    specifications: [
      { label: "Input", value: "PDF with selectable text; scanned image-only PDFs require OCR first" },
      { label: "Languages", value: "15 listed languages, including English, Hindi, Bengali, Marathi, Tamil, and Telugu" },
      { label: "Data sent externally", value: "Extracted text is sent to MyMemory only after the user checks the consent box; the PDF file itself stays in the browser" },
    ],
    privacy:
      "PDF text extraction and output assembly run in the browser. Translation requires explicit consent and sends extracted text to the MyMemory translation provider; do not submit confidential text unless you accept that transfer.",
    faqs: [
      { question: "Can this translate a scanned PDF?", answer: "Not directly. The tool extracts selectable text and does not perform OCR; scanned pages need OCR before translation." },
      { question: "Is the PDF or its text sent to a translation service?", answer: "The PDF file stays in the browser, but after you consent, its extracted text is sent to MyMemory for translation." },
      { question: "Will the translated PDF keep the original layout?", answer: "The tool rebuilds pages from translated text; it does not preserve the original page design exactly. Review the exported document for formatting and translation accuracy." },
    ],
  },
  "universal-media-downloader": {
    name: "Public Media Link Downloader",
    path: "/tools/universal-media-downloader",
    title: "Find available formats for a public media link",
    description:
      "Submit a public media URL to retrieve available video, audio, or image formats; supported sources, formats, and quality depend on that public link.",
    steps: [
      { name: "Copy a public link", text: "Copy the address of publicly accessible media that you have permission to save." },
      { name: "Submit the URL", text: "Paste it into the downloader and request the available formats." },
      { name: "Choose an available format", text: "Review source-provided formats and quality, then download only if you have the right to do so." },
    ],
    specifications: [
      { label: "Input", value: "Public media URL from a supported source" },
      { label: "Available output", value: "Source-dependent video, audio, or image formats and quality" },
      { label: "Restrictions", value: "No sign-in or bypass of private, age-restricted, regional, or other access controls" },
    ],
    privacy:
      "This tool sends the submitted public URL to DigiCyberCafe's server to retrieve format metadata; it is not a zero-upload client-side processor. The source platform may receive requests, and users should only save media they are authorized to download.",
    faqs: [
      { question: "Why are some resolutions or formats missing?", answer: "The list reflects the streams available for that public link. The downloader cannot create a quality or format the source does not provide." },
      { question: "Can I download private or age-restricted media?", answer: "No. The tool does not sign into accounts or bypass access restrictions; media must be publicly accessible without authentication." },
      { question: "Does this downloader process everything on my device?", answer: "No. The submitted media URL is processed by a server endpoint to retrieve format metadata. Do not submit private or sensitive links." },
    ],
  },
  "word-excel-to-pdf": {
    name: "Word and Excel to PDF Converter",
    path: "/tools/word-excel-to-pdf",
    title: "Convert supported Word and Excel files to PDF",
    description:
      "Convert DOCX, XLSX, or XLS files into a downloadable PDF in the browser; spreadsheet pages use vector PDF output while DOCX pages are rendered as images.",
    steps: [
      { name: "Choose an office file", text: "Select one DOCX, XLSX, or XLS file from your device." },
      { name: "Convert the document", text: "Start conversion and wait for the browser to render the file into PDF pages." },
      { name: "Review the result", text: "Check page breaks, tables, and formatting in the preview, then download the PDF." },
    ],
    specifications: [
      { label: "Input formats", value: "DOCX, XLSX, and XLS" },
      { label: "Spreadsheet output", value: "Workbook sheets are converted to vector PDF pages" },
      { label: "Word output", value: "DOCX is rendered to page images in the PDF; text is not selectable" },
    ],
    privacy:
      "Office files are read and converted in the browser. DOCX conversion renders pages to images; inspect output for layout changes and avoid treating the PDF as an editable source document.",
    faqs: [
      { question: "Can I convert an older .doc file?", answer: "The converter accepts DOCX, XLSX, and XLS; legacy .doc is not listed as a supported input. Save the document as .docx before conversion." },
      { question: "Will text in a converted Word PDF be searchable?", answer: "DOCX pages are rendered as images, so text is not selectable or searchable in the output." },
      { question: "Are all spreadsheet sheets included?", answer: "The workbook is read for conversion; review every output page to confirm the sheets and layout you need are represented as expected." },
    ],
  },
} satisfies Record<string, ToolAeoContent>;
