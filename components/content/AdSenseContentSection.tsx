"use client";

import { usePathname } from "next/navigation";

type Guide = {
  title: string;
  purpose: string;
  workflow: string;
  review: string;
  privacy: string;
  faq: { question: string; answer: string }[];
};

const guides: Record<string, Guide> = {
  "barcode-qr-generator": {
    title: "Creating and checking barcode or QR codes",
    purpose: "Use the barcode and QR generator to turn text, links, or supported identifiers into a scannable graphic. Choose a format that matches the value you need to encode; a QR code and a linear barcode are not interchangeable in every scanning system.",
    workflow: "Enter the value carefully, select the code family, and review its options before generating the preview. Short, correct source data is easier to scan and less likely to be truncated by a target system. If a code is intended for a form, inventory process, or payment flow, confirm the required symbology and payload with that service first.",
    review: "Test the generated image with more than one scanner when practical. Check that the decoded text exactly matches the original value, that the image has adequate contrast and a clear margin, and that resizing or printing has not blurred its edges. A successful preview is not proof that every device or destination will accept the code.",
    privacy: "Code generation is designed to happen in your browser. The encoded value may still be visible on your screen, in browser extensions, or in any image you choose to save or share. Do not encode passwords, access tokens, or other secrets into a code intended for public display.",
    faq: [
      { question: "Why does my scanner reject the code?", answer: "Check the selected code type, encoded value, quiet zone, contrast, and print size. Some scanners accept only specific formats or payload structures." },
      { question: "Can I use a QR code for payments?", answer: "Only if the payment provider accepts the generated payload and you verify the recipient and amount independently before use." },
    ],
  },
  "compress-pdf-to-target-kb": {
    title: "Reducing a PDF to a target file size",
    purpose: "This utility helps create a smaller PDF when a form or portal imposes a strict upload limit. A target in kilobytes is a goal, not a guarantee: source scans, embedded images, fonts, and page complexity determine how much a document can be reduced without unacceptable quality loss.",
    workflow: "Start with the smallest legitimate source file available, set a target that is safely below the destination limit, and allow the browser to process the document. Avoid repeated compression of an already-compressed result; each pass can reduce readability without much further size improvement. If the tool exposes quality or resolution choices, balance them against the smallest text and images that must remain legible.",
    review: "After exporting, confirm the actual file size and open every page at normal viewing size. Inspect small print, signatures, diagrams, and page orientation. Keep the original until the recipient accepts the output, and follow the recipient's limits for page count, dimensions, and file type as well as size.",
    privacy: "Processing behavior depends on the specific PDF tool. Where the interface describes local processing, the selected PDF is handled in your browser; server-backed features are explained in the Privacy Policy. Do not assume every DigiCyberCafe feature uses the same processing route.",
    faq: [
      { question: "Will the result always be below the limit?", answer: "No. Compression depends on the source file and settings. Verify the exported file size yourself and try a smaller target if there is room to do so." },
      { question: "Does compression remove text or pages?", answer: "The goal is to reduce file size, but quality can change. Review all pages and preserve an untouched copy of the original." },
    ],
  },
  "corporate-email-format": {
    title: "Drafting a professional workplace email",
    purpose: "The email-format utility provides editable starting points for common workplace messages such as leave requests, out-of-office replies, resignations, or appraisal discussions. Templates are prompts for clear communication, not a substitute for your employer's policies or required internal process.",
    workflow: "Choose the message type that fits your purpose, replace every sample detail, and make the subject specific. State the key request early, include dates or handover details where relevant, and use a tone appropriate to your relationship and workplace. Read the draft as the recipient would before copying or sending it.",
    review: "Check names, dates, contact details, attachments, and any commitments in the final text. Remove placeholders and personal information that is not necessary. If your organization has a standard form or approval workflow, use that official route and treat this draft only as writing assistance.",
    privacy: "Drafting happens in your browser; if you choose an email link, your mail application receives the message details you chose to include. Review the recipient and content before sending. DigiCyberCafe does not send the message on your behalf.",
    faq: [
      { question: "Does this send the email automatically?", answer: "No. It helps prepare text. You review, choose the recipient, and send it using your own email application." },
      { question: "Can I use the wording unchanged?", answer: "You can edit it, but verify it matches your employer's procedures, dates, and tone before sending." },
    ],
  },
  "free-invoice-generator": {
    title: "Preparing an invoice or quotation",
    purpose: "Use the invoice utility to draft a quotation, invoice, or supported business document with line items and totals. The generated file is a convenient record, but it cannot determine whether a tax treatment, invoice sequence, or legal disclosure is correct for your business.",
    workflow: "Enter the seller and customer details, choose the document type, and add each item with a clear description, quantity, and price. Check discounts, tax treatment, currency, payment details, and any terms before exporting. If you convert a quotation into an invoice, verify that the changed document number and date follow your own records.",
    review: "Recalculate totals independently for important transactions, inspect the exported PDF, and confirm the recipient's details before sending. GST, VAT, and other tax rules vary with jurisdiction and circumstances; consult current official guidance or a qualified adviser when needed.",
    privacy: "Some calculations and PDF creation occur in the browser, while business-profile preferences may be kept in local browser storage. Storage stays on that device unless you export or share the document. Clear local site data on shared devices and do not mistake a local profile for a secure backup.",
    faq: [
      { question: "Is this an official tax-compliant invoice?", answer: "It is a document-generation aid, not tax or legal advice. Check current rules and required fields before issuing an invoice." },
      { question: "Where is my business profile saved?", answer: "The tool may save it in this browser's local storage. It is not a cloud backup and can be removed when browser data is cleared." },
    ],
  },
  "hra-rent-receipt-generator": {
    title: "Preparing rent receipts for your records",
    purpose: "The rent-receipt utility can assemble rent details into a printable document for record keeping or an employer's review. A generated receipt does not establish that rent was paid and does not by itself prove eligibility for a tax benefit.",
    workflow: "Enter the tenant, landlord, property, rental period, amount, and any requested payment or stamp details accurately. Review each month's dates and totals, especially when generating a set of recurring receipts. Ask the landlord to verify and sign or acknowledge the receipt where the receiving organization requires it.",
    review: "Compare the output with actual payment records and your employer's documentation checklist. Requirements can change and depend on your circumstances. Do not invent payment dates or landlord information; correct discrepancies before exporting or sharing.",
    privacy: "Receipt information entered for generation is sensitive personal and financial information. Where generation is local, it remains in your browser unless you download or share it. Protect exported files, close the tool on shared devices, and check the Privacy Policy for features that use server storage.",
    faq: [
      { question: "Can a generated receipt be used as proof of payment?", answer: "No, not by itself. It must accurately reflect a real payment and may need acknowledgement and supporting records." },
      { question: "Does a receipt guarantee an HRA tax exemption?", answer: "No. Eligibility and evidence requirements depend on current tax rules and your circumstances." },
    ],
  },
  "image-background-remover": {
    title: "Removing or replacing a photo background",
    purpose: "A background-removal tool separates a foreground subject from parts of an image so you can prepare a transparent or replacement-background result. Hair, transparent objects, shadows, low contrast, and busy scenes can make edges difficult to identify.",
    workflow: "Choose a supported image, wait for the preview, and inspect the outline at full size. Adjust the available refinement controls, then select a suitable background and export format. Keep transparency if the next application needs it; formats such as JPEG do not preserve transparent pixels.",
    review: "Inspect hair, shoulders, glasses, and thin objects for missing or leftover background pixels. A cutout is an editing aid, not evidence that an image satisfies official photo rules. For identity documents, check the issuing authority's current photo requirements and avoid edits that alter facial appearance.",
    privacy: "This tool is intended to process the selected image in the browser. Model or asset files may be downloaded by the browser to enable processing. No browser-based claim covers other features such as server-backed media downloads or saved accounts; see the Privacy Policy for the complete distinction.",
    faq: [
      { question: "Why are some edges rough?", answer: "Fine hair, similar foreground and background colors, or a small source image can make segmentation less accurate. Try a well-lit, higher-resolution original." },
      { question: "Will a transparent image work everywhere?", answer: "Not always. Confirm that the destination supports transparency and the exported format." },
    ],
  },
  "id-card-front-back-joiner": {
    title: "Arranging both sides of an identity card",
    purpose: "The ID-card layout tool places front and reverse images on a printable sheet so you can keep both sides together. It is a layout aid only and does not verify identity, authenticity, or eligibility for any service.",
    workflow: "Select the correct front and reverse images, check their orientation, and choose a sheet or card layout suitable for the intended printer. Use the preview to align both sides and adjust scale before export. A test print on ordinary paper can help reveal sizing mistakes before using photo paper.",
    review: "Compare both printed sides with the originals, check that card text and codes remain readable, and measure the output rather than relying only on an on-screen preview. Keep the original files secure and avoid sending identity documents to anyone who does not need them.",
    privacy: "This image layout workflow is designed to run in the browser. The resulting print file is saved or printed only when you choose. Images can still be exposed through browser extensions, device backups, shared printers, or files you send to others.",
    faq: [
      { question: "Will the output match a particular card size?", answer: "Use the selected dimensions as a guide and verify printer scaling and page settings. Printer margins and fit-to-page options can change the physical size." },
      { question: "Is the generated sheet an official ID?", answer: "No. It is only a print layout made from the images you provide." },
    ],
  },
  "image-to-pdf-converter": {
    title: "Converting images into a PDF",
    purpose: "An image-to-PDF workflow combines supported pictures into a document that is easier to print, archive, or submit to a form that accepts PDF. Page size, order, orientation, and image resolution affect the result.",
    workflow: "Select the images in the order you want, check each rotation, and choose a page layout that keeps important details visible. Avoid stretching a small image to fill a large page. Generate the PDF and open it in a separate viewer to confirm that every page is present and in sequence.",
    review: "Check readability at normal zoom, page orientation, file size, and whether the receiving service permits the chosen dimensions. If the PDF contains a photograph of text, verify every number and name against the source before relying on it.",
    privacy: "The conversion path depends on the specific page and is described in its interface. Locally processed files are handled in the browser; server-backed features are identified in the Privacy Policy. Downloaded PDFs remain your responsibility to protect and delete when no longer needed.",
    faq: [
      { question: "Can I combine several images?", answer: "Supported images can be placed into a multi-page PDF. Review the order and page count before saving." },
      { question: "Does conversion improve image quality?", answer: "No. Conversion changes the container and layout; it cannot restore detail missing from the original image." },
    ],
  },
  "image-to-pdf": {
    title: "Turning photos into a printable PDF",
    purpose: "This image-to-PDF page is useful when a destination asks for a single document rather than separate image files. The PDF page arrangement can influence print size, margins, and how much detail remains legible.",
    workflow: "Add the images needed for the document, arrange the page sequence, select the available paper and fit options, and check the preview. Use the original image where possible, rather than a screenshot of a screenshot, to preserve readable detail.",
    review: "Before sending, open the exported PDF and inspect page order, rotation, margins, color, and small text. Check that the final file stays within any upload size limit and keep a separate copy of originals.",
    privacy: "For tools that process locally, files are handled on your device until you choose to export. The site also has server-backed services, so do not assume every feature has an identical data path. Read the Privacy Policy and tool-specific notices.",
    faq: [
      { question: "Can I print the PDF at the original photo size?", answer: "That depends on page layout and print scaling. Check the dimensions and disable unwanted fit-to-page scaling when printing." },
      { question: "Are my photos uploaded?", answer: "This conversion is intended to run in the browser. Check the page's tool notice; separate server-backed features are explained in the Privacy Policy." },
    ],
  },
  "merge-pdf-files": {
    title: "Combining PDF files in a chosen order",
    purpose: "Merging combines pages from selected PDFs into one document, which can simplify review or submission when the recipient permits a combined file. It does not validate that the pages belong together or that the resulting document meets a portal's rules.",
    workflow: "Choose the source PDFs, arrange the documents and pages in the intended sequence, and inspect the preview before creating the merged output. Remove duplicate or unrelated pages and check for password-protected or damaged sources that may not be processed as expected.",
    review: "Open the merged PDF and confirm total page count, page order, orientation, links, form fields, and signatures. Some PDF features may not survive every merge workflow. Retain the originals until you have confirmed the final document can be opened by its recipient.",
    privacy: "Many PDF operations are performed in your browser, but processing can vary by feature. The tool-specific notice and Privacy Policy explain the service's server-backed exceptions. A file becomes shared only when you choose to send or upload the exported result elsewhere.",
    faq: [
      { question: "Can I change the page order?", answer: "Where ordering controls are provided, arrange pages before exporting and verify the resulting order in a PDF viewer." },
      { question: "Will digital signatures remain valid?", answer: "Editing or merging can invalidate or remove signature validation. Check the resulting document and obtain a fresh signature if required." },
    ],
  },
  "mutual-fund-sip-lumpsum-calculator": {
    title: "Estimating investment growth with a calculator",
    purpose: "The SIP and lumpsum calculator illustrates how assumed contributions and a rate of return may compound over time. Its output is a mathematical estimate, not a forecast, promise, recommendation, or representation of a particular fund's performance.",
    workflow: "Enter the contribution amount, investment period, contribution frequency, and an assumed annual return. Confirm whether the calculator treats deposits at the start or end of each period and how it converts annual returns to periodic growth. Compare more than one assumption rather than treating a single output as a target.",
    review: "Actual investments can lose value and returns are not constant. Fees, taxes, inflation, missed contributions, changing regulations, and market movements may change real outcomes. Verify important calculations independently and seek a registered financial professional for personalized advice.",
    privacy: "Calculator inputs are general financial assumptions. Do not enter account credentials, investor identifiers, or other highly sensitive information. This page's calculation does not establish or execute an investment transaction.",
    faq: [
      { question: "Is the displayed amount guaranteed?", answer: "No. It is a projection based on assumptions and actual returns may be lower, higher, or negative." },
      { question: "Does the result include tax or fees?", answer: "Do not assume so. Check the calculator's displayed inputs and account separately for applicable costs and taxes." },
    ],
  },
  "passport-photo-maker": {
    title: "Preparing a passport or visa photograph",
    purpose: "A passport-photo maker can crop and resize a portrait to common dimensions and file-size limits. Every government, visa, examination, and application authority can set different physical, pixel, background, expression, and file rules.",
    workflow: "Begin with a clear, recent, evenly lit photograph, select the destination's exact requirements, and position the face using the preview. Export using the specified dimensions and file type. Treat any preset as a convenience only; verify the current official instructions before paying for printing or submitting an application.",
    review: "Check head position, background, image dimensions, file size, color, and whether the image has been altered in a way the authority prohibits. A tool cannot guarantee acceptance. Save the original and compare the final image at full resolution before upload.",
    privacy: "This photo editing tool processes the selected image in the browser. The image is not sent to our image-processing server by this workflow. This does not describe all site features; account and saved-document features have server-side processing described in our Privacy Policy.",
    faq: [
      { question: "Which size should I select?", answer: "Use the current dimensions stated by the authority for your particular application. Common sizes are not universal." },
      { question: "Will the authority accept the result?", answer: "Acceptance is decided by the authority, not this utility. Check all current rules and review the final image." },
    ],
  },
  "pdf": {
    title: "Choosing and reviewing a PDF utility",
    purpose: "The PDF hub brings together common document tasks such as organizing, converting, compressing, signing, or marking up files. Each operation changes a different aspect of a document, so select the specific tool that matches your goal.",
    workflow: "Read the individual tool's instructions, make a copy of important source material, and select only the files needed for the task. Preview the result before exporting. Large, scanned, encrypted, or complex documents may require more memory or behave differently across browsers.",
    review: "Open the finished document in a separate viewer and confirm page count, text, images, form fields, annotations, and signatures. PDF conversion and editing can change document structure. Never rely on an unreviewed export as the only copy of a legal, financial, or application record.",
    privacy: "Many PDF tools are designed for in-browser processing, but not every feature on the website uses the same route. Saved documents and accounts are server-backed. Read the relevant page notice and Privacy Policy before using sensitive files.",
    faq: [
      { question: "Does the PDF hub upload every file?", answer: "No single statement covers every tool. Many process in the browser, while specific features use server-backed services as disclosed in the Privacy Policy." },
      { question: "What if a PDF does not open?", answer: "Try an unencrypted copy, a current browser, or a smaller document. Preserve the source and use a trusted PDF reader to check for file damage." },
    ],
  },
  "pdf-compress": {
    title: "Compressing a PDF while checking readability",
    purpose: "PDF compression can reduce storage or upload size, especially for image-heavy scans. The smallest possible file is not always the most useful: legible text and evidence should take priority over a strict target when compression would make a document unreadable.",
    workflow: "Choose a copy of the source file, apply the available compression settings, and compare output size and visual clarity. If the document contains scanned text, charts, or signatures, use a more conservative setting and avoid compressing the same output repeatedly.",
    review: "Open every page after export. Confirm the file size, page dimensions, text clarity, colors, and signature visibility. Follow the destination's actual size limit and keep the original until the result is accepted.",
    privacy: "Check this page's processing notice to understand whether the file remains in your browser. Other DigiCyberCafe functions, including saved documents and media downloads, are server-backed. The Privacy Policy describes these separate processing paths.",
    faq: [
      { question: "Why is the PDF still large?", answer: "Already-compressed images, embedded fonts, and complex page content can limit further size reduction." },
      { question: "Can compression blur a scanned page?", answer: "Yes. Review small print and signatures at useful zoom and use the original if the output is no longer clear." },
    ],
  },
  "pdf-watermark": {
    title: "Adding a watermark to PDF pages",
    purpose: "A watermark can label a document as a draft, copy, or internal version, or add another mark where you are authorized to do so. It changes the appearance of pages but does not secure the contents or prove who created the document.",
    workflow: "Use a copy of the PDF, choose text and placement that do not cover important content, and check opacity, size, and page coverage in the preview. Consider whether the mark belongs on every page or only selected pages, then export after confirming that the watermark is appropriate for the document's audience.",
    review: "Inspect each page, including pages with footnotes, signatures, and images. Confirm text remains readable and that the mark does not imply official approval, ownership, or confidentiality that is not accurate. Keep the original and confirm the recipient accepts watermarked files.",
    privacy: "PDF watermarking is intended to run in the browser. The file remains on your device until you export or share it. This does not cover account or saved-document features, which use server storage as described in the Privacy Policy.",
    faq: [
      { question: "Does a watermark prevent copying?", answer: "No. It is a visible annotation and can often be removed or altered; it is not encryption or access control." },
      { question: "Can I watermark an official document?", answer: "Check the issuer's and recipient's rules first. An added mark may make a document unacceptable or misleading." },
    ],
  },
  "pdf-editor": {
    title: "Making and reviewing PDF edits",
    purpose: "A PDF editor helps annotate or modify a document for a particular workflow. The exact tools available can vary by browser and file type; editing a PDF is not the same as changing the authoritative source record.",
    workflow: "Keep an untouched copy, open the document, and make only the edits needed. Verify page position and content in the preview before saving. If the file contains forms, embedded media, accessibility structure, or digital signatures, check how the selected operation affects those features.",
    review: "After export, reopen the file and inspect every edited page, links, comments, text alignment, accessibility, and any signature indicators. Never treat a visual mark as proof that a digital signature remains valid. Ask the document owner if you are not authorized to modify the source.",
    privacy: "Use the tool's on-page processing disclosure and the Privacy Policy to determine whether your file is processed locally or stored. Keep confidential files off shared devices and do not export them to untrusted services.",
    faq: [
      { question: "Will edits preserve a digital signature?", answer: "Often an edit changes the document and invalidates signature verification. Confirm with the signer or receiving organization." },
      { question: "Can I undo an exported change?", answer: "The original file is not a substitute for an export history. Keep a separate unmodified copy before editing." },
    ],
  },
  "pdf-merge": {
    title: "Merging PDF pages into one file",
    purpose: "Merging is useful when separate, related documents need to be reviewed together and the recipient allows a single PDF. It does not certify document authenticity, completeness, or correctness.",
    workflow: "Select relevant source PDFs, arrange their order, and use the available preview to check page sequence. Leave out duplicate pages and verify that every file is the intended version. Create the merged file only after checking any page-selection controls.",
    review: "Open the output in a different viewer and check every page, orientation, embedded links, forms, and signatures. Keep source files unchanged, particularly where a signed or official copy must remain verifiable.",
    privacy: "PDF merging is commonly performed in the browser in this application, but verify the specific tool disclosure. Server-side accounts, saved documents, and media features are separate and described in the Privacy Policy.",
    faq: [
      { question: "Can I reorder documents before merging?", answer: "Use the tool's order controls if available, then confirm the final sequence in a PDF reader." },
      { question: "Is a merged file a certified copy?", answer: "No. It is a combined file and does not provide notarization, certification, or signature validation." },
    ],
  },
  "pdf-split": {
    title: "Extracting selected pages from a PDF",
    purpose: "Splitting creates a separate file from selected pages or ranges. It can help prepare an excerpt, but extracted pages may lose context or connected signature validation from the original document.",
    workflow: "Check page numbering in the viewer, enter the desired range using the tool's format, and preview what will be included. Numbering shown by a viewer can differ from printed page labels, so compare both when selecting a formal section.",
    review: "Open the extracted document and confirm its first and last pages, sequence, bookmarks, form fields, and any signatures. Keep the complete original and disclose when an excerpt is incomplete if you share it.",
    privacy: "Review the page's processing notice before selecting confidential material. Many PDF operations run in the browser; features such as saved documents use server-side storage as described in the Privacy Policy.",
    faq: [
      { question: "Why do the page numbers seem different?", answer: "A PDF can display printed page labels that differ from its internal page positions. Check the actual page preview." },
      { question: "Does splitting preserve signatures?", answer: "Not necessarily. Extraction changes the file and can invalidate signature checks; confirm with the recipient." },
    ],
  },
  "photo-enhancer-online": {
    title: "Enhancing a photo without losing the original",
    purpose: "Photo enhancement can adjust clarity, contrast, exposure, or other image qualities. Automated processing and sliders cannot recover detail that was never captured, and aggressive changes may make a picture less natural or less appropriate for official use.",
    workflow: "Start with the original image, make gradual adjustments, and compare the result against the unedited preview. Export only after checking that colors and facial details remain realistic. Use a copy when trying stronger settings.",
    review: "Inspect faces, fine text, edges, and dark or bright regions at full size. If the result will be used for identity verification, an exam form, or evidence, follow the receiving authority's rules on enhancement and avoid misleading edits.",
    privacy: "This photo tool is designed for browser-based image editing. Processing assets can be loaded by your browser. This disclosure does not extend to server-backed account or media features elsewhere on the site.",
    faq: [
      { question: "Can enhancement restore a blurry photo?", answer: "It may improve perceived sharpness, but it cannot reliably recreate missing detail or prove what an unclear image originally showed." },
      { question: "Is the edited file suitable for every official form?", answer: "Not necessarily. Check whether the authority allows edits and follow its specific photo rules." },
    ],
  },
  "photo-name-date-generator": {
    title: "Adding a name and date to a photo",
    purpose: "A name-and-date photo utility can place supplied text on an image for forms that explicitly request a dated or labeled photograph. Many authorities specify exact wording, location, font, size, or whether annotation is allowed at all.",
    workflow: "Read the destination instructions first, enter the person's name and the correct capture date, and check layout and image dimensions. Use a clear source photo and avoid covering the face or other required details. Export in the exact supported format and size.",
    review: "Compare the final image against the authority's latest specification. Confirm spelling, date format, position, file size, and pixel dimensions. Do not claim a capture date or identity that is not accurate, and retain the unmodified original.",
    privacy: "The photo edit is designed to occur in the browser. The file remains on your device until you choose to download or share it. Other service features may use server-side processing, as described by the Privacy Policy.",
    faq: [
      { question: "Which date format should I enter?", answer: "Use the format and date definition required by the receiving form, which may specify the date of photography rather than upload." },
      { question: "Can I add a date to any application photo?", answer: "No. Some authorities prohibit overlays. Confirm that the destination expressly allows the requested annotation." },
    ],
  },
  "sarkari-exam-age-calculator": {
    title: "Checking an examination age cutoff",
    purpose: "An exam-age calculator compares a date of birth with a cutoff date and may help you understand published eligibility information. Each recruitment notice controls the age range, category relaxation, qualifying date, and accepted evidence.",
    workflow: "Choose the exact examination or enter the relevant dates from its current official notification. Verify the date of birth, cutoff date, and category inputs. Read the notice for special conditions such as residency, service, disability, or post-specific limits not represented by a basic age calculation.",
    review: "Treat the displayed age as a calculation aid, not an eligibility decision. Compare it with the official notice and any corrigenda, and contact the recruiting authority if a condition is unclear. Do not rely on an old list for a new recruitment cycle.",
    privacy: "Date-of-birth calculations are intended to run in the browser and are not a substitute for submitting information on an official portal. Avoid entering identity numbers or account credentials into a calculator.",
    faq: [
      { question: "Does an age result mean I qualify?", answer: "No. It checks only the entered date conditions. The authority decides eligibility under the full notification." },
      { question: "Where should I find the cutoff date?", answer: "Use the current official recruitment notification and any later correction notices." },
    ],
  },
  "ppt-to-pdf": {
    title: "Converting presentation slides to PDF",
    purpose: "A presentation-to-PDF converter makes slides easier to distribute or print where PDF is accepted. Conversion may change fonts, animations, embedded media, transitions, speaker notes, and page layout.",
    workflow: "Choose the supported presentation file, select the desired output options, and wait for conversion to finish. If the deck uses unusual fonts or media, compare the PDF with the presentation in its original application. For important work, save a separate copy before conversion.",
    review: "Check slide count, ordering, typography, images, charts, page size, and notes. PDFs generally do not preserve interactive presentation behavior. Confirm the receiving service accepts the resulting format and size.",
    privacy: "Some office-document conversions use a server-side conversion service rather than only local browser processing. Do not upload confidential presentations unless you understand the service path and are authorized to do so; see the Privacy Policy for data handling.",
    faq: [
      { question: "Will animations play in the PDF?", answer: "No. A PDF is a static document and does not preserve presentation animations or slide transitions." },
      { question: "Why did a font change?", answer: "The converter or PDF viewer may not have the original font available. Review the result and use an embedded or supported font where possible." },
    ],
  },
  "sign-pdf-online": {
    title: "Adding a signature mark to a PDF",
    purpose: "A signature tool can place a drawn or typed mark on a document. A visual mark is not necessarily a cryptographic digital signature and may not meet the legal or recipient-specific requirements for execution.",
    workflow: "Confirm you have authority to sign the document, review the complete text first, and place the mark only in the intended location. Save an unmodified original and follow the recipient's instructions for identity verification, witnesses, certificates, or other formalities.",
    review: "Open the output and check the signature position and all pages. Ask the recipient whether a visual signature is acceptable; some workflows require a specific e-sign service or certificate. Never sign on behalf of another person without lawful authorization.",
    privacy: "Treat signed files as sensitive. Check the tool notice for its processing path and keep exported documents secure. Account and document-storage features elsewhere in DigiCyberCafe use server-side services described in the Privacy Policy.",
    faq: [
      { question: "Is a drawn mark a verified digital signature?", answer: "No. A visible mark alone does not establish identity, document integrity, or certificate-based signature validity." },
      { question: "Is this legally valid everywhere?", answer: "Legal effect depends on jurisdiction, document type, identity checks, consent, and recipient rules. Obtain appropriate advice when needed." },
    ],
  },
  "split-pdf-pages": {
    title: "Separating pages from a PDF",
    purpose: "Page separation creates individual or smaller PDF files from a larger document. This is useful for extracting a section when permitted, but may remove surrounding context and change how signatures or bookmarks validate.",
    workflow: "Inspect the document's page order, identify exact page numbers, and use the preview to confirm the selection. Remember that printed labels can differ from the PDF's internal page index. Keep a copy of the original while generating the separate files.",
    review: "Open each output and verify that the requested pages appear in order with readable content. Check page orientation and file names before sending. If the source is signed or official, ask whether an extracted copy is acceptable.",
    privacy: "Review the processing disclosure for this particular tool. Many PDF features are browser-based, but the site also offers server-backed functions. The Privacy Policy explains these exceptions and saved-document handling.",
    faq: [
      { question: "Can I extract non-consecutive pages?", answer: "Use the range syntax supported by the tool and verify the output page-by-page before sharing." },
      { question: "Will extracted pages remain certified?", answer: "Extraction can affect validation and does not create a certified copy. Check with the document issuer or recipient." },
    ],
  },
  "target-kb-file-resizer": {
    title: "Resizing a file for an upload limit",
    purpose: "A target-size resizer helps reduce supported images or documents toward a portal's stated file limit. Compression and resizing can alter quality, dimensions, and readability; the final file must be checked against the destination's complete specification.",
    workflow: "Choose a suitable original, note the required file type and size, then set a target with enough margin to account for portal rounding. Export once and check the actual size, pixel dimensions, and visual result. If needed, adjust settings gradually rather than repeatedly recompressing the same output.",
    review: "Confirm the exported file opens correctly and that text, faces, signatures, or other critical details remain clear. Compare size in bytes with the actual portal limit, and retain the original until submission is complete.",
    privacy: "The image-resizing workflow is designed for browser processing. This does not apply to every feature on the site; saved documents, accounts, and media extraction use server services disclosed in the Privacy Policy.",
    faq: [
      { question: "Why is my file slightly over the target?", answer: "Target compression can be approximate. Export with a smaller target and check the final size in your file manager." },
      { question: "Will reducing file size change dimensions?", answer: "Depending on the selected operation, it may change quality, pixel dimensions, or both. Verify each required property after export." },
    ],
  },
  "text-to-pdf-converter": {
    title: "Preparing a PDF from text",
    purpose: "A text-to-PDF tool formats supplied text as a document for printing or sharing. Page size, margins, line wrapping, font, and special characters can affect how the output appears in a viewer or on paper.",
    workflow: "Enter or paste only the content you want in the document, choose readable formatting, and preview page breaks before exporting. Check names, punctuation, tables, and non-Latin characters. For confidential material, understand whether the particular conversion runs locally or on a server.",
    review: "Open the PDF and verify that no paragraphs are clipped, page breaks make sense, and fonts render correctly. If the document is formal, check its required template and signature process rather than assuming a generated PDF satisfies them.",
    privacy: "Text entered into a local conversion stays in the browser until you export or share it. Avoid pasting passwords or unnecessary sensitive data. Server-backed account and saved-document features are described separately in the Privacy Policy.",
    faq: [
      { question: "Will formatting match my source document?", answer: "Not necessarily. Plain-text conversion may not preserve rich formatting, embedded objects, or page layout from other editors." },
      { question: "Can I use the PDF as an official form?", answer: "Only if the relevant authority accepts it. Follow its current templates, required fields, and submission rules." },
    ],
  },
  "translate-pdf-document": {
    title: "Understanding translated PDF content",
    purpose: "Document translation can help readers understand content in another language, but automated translation may miss technical context, legal nuance, names, tables, and formatting. It should not be treated as an authoritative translation unless the recipient accepts it.",
    workflow: "Use a document you are authorized to process, select the correct source and target languages, and review the extracted text before relying on the translation. Scanned PDFs may need text recognition, which can introduce additional errors. Keep the original beside the translated copy for comparison.",
    review: "Check numbers, dates, names, negations, units, headings, and table alignment against the original. For legal, medical, immigration, or official material, use a qualified human translator when accuracy or certification matters.",
    privacy: "The PDF is parsed in your browser, but the translation feature sends extracted text to MyMemory when you confirm the translation. Do not submit confidential or personal text unless you accept that provider's processing terms. Consult the Privacy Policy for other server-backed features and data handling.",
    faq: [
      { question: "Is an automated translation certified?", answer: "No. Certification requires an appropriately qualified translator and depends on the receiving authority's rules." },
      { question: "Why are some parts missing?", answer: "Scans, complex layouts, handwriting, or image-only pages may not extract as text. Compare every section with the original." },
    ],
  },
  "universal-media-downloader": {
    title: "Using the media downloader responsibly",
    purpose: "The media downloader accepts supported public URLs and can inspect or stream selected media formats. A link being publicly viewable does not mean you own the work or have permission to download, copy, redistribute, or bypass access controls.",
    workflow: "Use only a supported link and select a format permitted by the source platform and rights holder. Avoid private, restricted, or access-controlled material. Check the platform's terms and applicable copyright rules before beginning a download, and do not share another person's material without permission.",
    review: "The media URL is sent to a server-side extraction service; unlike many image and PDF utilities, this feature is not entirely client-side. Server availability, source changes, network conditions, and rights restrictions can prevent a download. Keep the request within lawful and platform-approved use.",
    privacy: "When you submit a URL, our server processes it to retrieve media information or stream a file. The service may also process technical request data for security and troubleshooting. Do not submit private URLs, signed URLs, credentials, or confidential content.",
    faq: [
      { question: "Is every public video free to download?", answer: "No. Public access does not grant copyright or redistribution rights. Follow the source platform's terms and obtain permission where required." },
      { question: "Does this tool upload my local files?", answer: "It processes a URL you submit on the server; it does not need a local video file as input. The URL itself is sent to our server." },
    ],
  },
  "word-excel-to-pdf": {
    title: "Converting office documents to PDF",
    purpose: "Converting a word-processing or spreadsheet file to PDF can make its layout easier to share consistently. Fonts, formulas, page breaks, hidden rows, headers, comments, and embedded objects may convert differently from the original application.",
    workflow: "Choose the correct source file and ensure it does not contain hidden material you do not intend to share. For spreadsheets, check print areas and scaling; for documents, check fonts, comments, and tracked changes. Convert a copy and compare the result with the source.",
    review: "Inspect every page and sheet, formulas and totals, orientation, headers, footers, and accessibility. Verify sensitive metadata and hidden content in the original application before distribution. A PDF export can flatten interactive or editable features.",
    privacy: "Office conversion may use a server-side service. Do not process confidential or regulated files unless you understand and accept the processing route. The Privacy Policy describes server-backed processing and document storage.",
    faq: [
      { question: "Will spreadsheet formulas still calculate in a PDF?", answer: "No. A PDF normally shows rendered values and layout, not a live spreadsheet calculation model." },
      { question: "Will comments or tracked changes appear?", answer: "They may, depending on the source and conversion settings. Review and clean the file before exporting." },
    ],
  },
  downloader: {
    title: "Using supported media download features",
    purpose: "This downloader page provides a way to request media from supported public URLs where the platform and rights holder permit it. Always confirm that you are authorized to save and use the selected material.",
    workflow: "Submit only a supported URL, select an available format, and allow the service to retrieve the media. The URL is processed by our server-side extraction service, so do not include private links, login tokens, or restricted content.",
    review: "Check source terms and copyright restrictions before download or reuse. Results can be affected by platform changes and availability; an accessible link is not proof that copying or redistribution is allowed.",
    privacy: "This feature is server-backed and not a zero-upload workflow. The server receives the URL and processes the requested media. Technical request details may also be used for security and troubleshooting as described in the Privacy Policy.",
    faq: [
      { question: "Is this downloader fully client-side?", answer: "No. The submitted URL is handled by a server-side extraction process." },
      { question: "Can I repost downloaded material?", answer: "Only when you have the necessary rights and comply with platform rules and applicable law." },
    ],
  },
};

const defaultGuide: Guide = {
  title: "How to use this online utility carefully",
  purpose: "This browser utility is intended to make a focused document, image, or information task easier. Start by identifying what the destination or your own workflow actually requires, then use the matching controls rather than changing settings unnecessarily. A tool-generated result is an aid: it cannot decide whether a document is legally sufficient, an image meets an authority's requirements, or a calculation applies to your circumstances.",
  workflow: "Prepare a copy of the source where possible, check that the file type is supported, and enter only the information needed. Follow the on-screen steps in order and use the preview to catch mistakes before exporting. Browser memory, device performance, file complexity, and format support can affect completion. If an operation fails, preserve the original and try a supported, smaller copy rather than repeatedly submitting sensitive data.",
  review: "Open every exported file in a separate viewer. Verify page order, dimensions, spelling, dates, readability, file size, and any signatures or metadata relevant to your task. Compare important values with the source and follow the receiving service's latest requirements. Keep an unmodified original until you know the output is usable; a successful download or preview is not a guarantee of acceptance.",
  privacy: "Many DigiCyberCafe photo, PDF, and document utilities are designed to process files in your browser. The site also has server-backed account, saved-document, and office-conversion functions. Processing differs by tool: read the local notice and the Privacy Policy before selecting confidential files. Browser extensions, synced browsing, downloaded outputs, and shared devices are outside our control.",
  faq: [
    { question: "Are all DigiCyberCafe tools fully client-side?", answer: "No. Many file utilities process in the browser, but account, saved-document, and some conversion features use servers. The Privacy Policy explains the difference." },
    { question: "Does a generated result guarantee acceptance?", answer: "No. Always check the receiving authority's current requirements and review the output yourself." },
    { question: "What should I do before processing an important file?", answer: "Keep a separate original, remove unrelated sensitive information, and read the tool's processing notice." },
    { question: "Where can I ask a question or report an error?", answer: "Contact the operator at ecybercafe.official@gmail.com or use the Contact page." },
  ],
};

export default function AdSenseContentSection() {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const guide = guides[slug] ?? defaultGuide;

  return (
    <section aria-labelledby="tool-guide-title" className="mx-auto my-10 max-w-5xl rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 sm:p-8">
      <h2 className="text-2xl font-semibold text-slate-900" id="tool-guide-title">{guide.title}</h2>
      <p className="mt-4">{guide.purpose}</p>
      <h3 className="mt-7 text-lg font-semibold text-slate-900">Recommended workflow</h3>
      <p className="mt-2">{guide.workflow}</p>
      <h3 className="mt-7 text-lg font-semibold text-slate-900">Review before using or sharing</h3>
      <p className="mt-2">{guide.review}</p>
      <h3 className="mt-7 text-lg font-semibold text-slate-900">Privacy and responsible use</h3>
      <p className="mt-2">{guide.privacy}</p>
      <h3 className="mt-7 text-lg font-semibold text-slate-900">A careful final check</h3>
      <p className="mt-2">
        Before you begin, identify the exact outcome you need and the rules of the
        service that will receive it. A file-size limit, image dimension, page
        order, or calculation date can be more important than a default setting.
        Keep source material unchanged, use only the minimum personal information
        required, and do not enter credentials or payment secrets into a general
        utility. If the browser reports an unsupported file or an incomplete
        result, stop and verify the source rather than assuming the export is
        correct.
      </p>
      <p className="mt-3">
        After processing, compare the output with the source and test it in the
        context where it will be used. Check the receiving organization&apos;s current
        instructions, confirm that the format and file size are accepted, and
        retain a secure copy of important originals. For official, financial,
        legal, or identity documents, ask the responsible authority or a
        qualified professional when a decision depends on interpretation. These
        practical checks help catch common errors, but they do not replace an
        official review or guarantee that a result will be accepted.
      </p>
      <p className="mt-3">
        Keep a clear distinction between a file saved only on your device and a
        file deliberately sent to an outside service. Some browser tools load
        fonts or models from third parties, and translation sends selected text
        to its provider after you give consent. Review prompts before confirming,
        close the page when finished on a shared computer, and delete temporary
        downloads or local browser data when appropriate. If a tool uses a
        server-backed feature, its processing route should be checked in the
        Privacy Policy before submitting sensitive material.
      </p>
      <section aria-labelledby="tool-guide-faq" className="mt-8">
        <h3 className="text-lg font-semibold text-slate-900" id="tool-guide-faq">Frequently asked questions</h3>
        {guide.faq.map(({ question, answer }) => (
          <details className="border-b border-slate-200 py-3" key={question}>
            <summary className="cursor-pointer font-medium text-slate-800">{question}</summary>
            <p className="mt-2">{answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
