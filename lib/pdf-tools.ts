import { PDFDocument, rgb } from "pdf-lib";

type PdfEdit = { kind: "text" | "erase"; value: string; x: number; y: number };

export async function mergePdfFiles(files: File[]) {
  const output = await PDFDocument.create();
  for (const file of files) { const source = await PDFDocument.load(await file.arrayBuffer()); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach((page) => output.addPage(page)); }
  return new Blob([new Uint8Array(await output.save())], { type: "application/pdf" });
}

export async function splitPdfFile(file: File, pageIndices: number[]) {
  const source = await PDFDocument.load(await file.arrayBuffer()); const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndices); pages.forEach((page) => output.addPage(page));
  return new Blob([new Uint8Array(await output.save())], { type: "application/pdf" });
}

export async function imageFilesToPdf(files: File[]) {
  const output = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const image = file.type === "image/png" ? await output.embedPng(bytes) : await output.embedJpg(bytes);
    const page = output.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return new Blob([new Uint8Array(await output.save())], { type: "application/pdf" });
}

export async function compressPdfFile(file: File) {
  const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  return new Blob([new Uint8Array(await source.save({ useObjectStreams: true, addDefaultPage: false }))], { type: "application/pdf" });
}

export async function pdfWithEdits(file: File, edits: PdfEdit[]) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const page = source.getPage(0);
  const { width, height } = page.getSize();
  for (const edit of edits) {
    const x = (edit.x / 100) * width;
    const y = height - (edit.y / 100) * height;
    if (edit.kind === "erase") page.drawRectangle({ x, y: y - 24, width: 150, height: 32, color: rgb(1, 1, 1) });
    else page.drawText(edit.value, { x, y, size: 14, color: rgb(0.12, 0.29, 0.23) });
  }
  return new Blob([new Uint8Array(await source.save())], { type: "application/pdf" });
}

export async function watermarkPdfFile(file: File, text: string) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  for (const page of source.getPages()) { const { width, height } = page.getSize(); page.drawText(text.trim() || "CONFIDENTIAL", { x: width * 0.2, y: height * 0.48, size: Math.min(width, height) * 0.055, color: rgb(0.55, 0.55, 0.55), opacity: 0.22, rotate: { type: "degrees", angle: 35 } as never }); }
  return new Blob([new Uint8Array(await source.save())], { type: "application/pdf" });
}
