import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import * as XLSX from "@e965/xlsx";
import { renderAsync } from "docx-preview";
import html2canvas from "html2canvas";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

export async function mergePdfFiles(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length < 2) throw new Error("Choose at least two PDF files to merge.");
  const merged = await PDFDocument.create();
  for (const buffer of buffers) {
    const source = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export async function splitPdf(buffer: ArrayBuffer, pageRanges: string): Promise<Record<string, Uint8Array>> {
  const source = await PDFDocument.load(buffer);
  const pageCount = source.getPageCount();
  const selections = pageRanges.trim().toLowerCase() === "all"
    ? Array.from({ length: pageCount }, (_, index) => ({ label: `page-${index + 1}`, pages: [index] }))
    : parsePageRanges(pageRanges, pageCount);

  const outputs: Record<string, Uint8Array> = {};
  for (const selection of selections) {
    const document = await PDFDocument.create();
    const pages = await document.copyPages(source, selection.pages);
    pages.forEach((page) => document.addPage(page));
    outputs[`${selection.label}.pdf`] = await document.save();
  }

  if (Object.keys(outputs).length <= 1) return outputs;
  const archive = new JSZip();
  Object.entries(outputs).forEach(([name, bytes]) => archive.file(name, bytes));
  return { "split-pdf-pages.zip": await archive.generateAsync({ type: "uint8array" }) };
}

function parsePageRanges(input: string, pageCount: number) {
  if (!input.trim()) throw new Error("Enter pages like 1-3, 5, or use ‘all’ for separate pages.");
  return input.split(",").map((part) => {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`Invalid page range: ${part.trim()}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page ranges must be between 1 and ${pageCount}.`);
    }
    const pages = Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
    return { label: start === end ? `page-${start}` : `pages-${start}-${end}`, pages };
  });
}

export async function convertImagesToPdf(files: File[], layout: "fit-page" | "a4-margin" = "fit-page"): Promise<Uint8Array> {
  if (!files.length) throw new Error("Choose at least one image.");
  const output = await PDFDocument.create();
  for (const file of files) {
    const { bytes, width, height, type } = await getJpegOrPng(file);
    const image = type === "image/png" ? await output.embedPng(bytes) : await output.embedJpg(bytes);
    if (layout === "fit-page") {
      const page = output.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
      continue;
    }
    const margin = 36;
    const scale = Math.min((A4_WIDTH - margin * 2) / width, (A4_HEIGHT - margin * 2) / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    const page = output.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(image, { x: (A4_WIDTH - drawWidth) / 2, y: (A4_HEIGHT - drawHeight) / 2, width: drawWidth, height: drawHeight });
  }
  return output.save();
}

async function getJpegOrPng(file: File): Promise<{ bytes: Uint8Array; width: number; height: number; type: string }> {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    return { bytes: new Uint8Array(await file.arrayBuffer()), width: await imageDimension(file, "width"), height: await imageDimension(file, "height"), type: file.type };
  }
  if (!["image/webp", "image/avif"].includes(file.type)) throw new Error(`${file.name} is not a PNG, JPEG, or WebP image.`);
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not create an image canvas.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not encode the image.")), "image/jpeg", 0.95));
  const result = { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height, type: "image/jpeg" };
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

async function imageDimension(file: File, dimension: "width" | "height") {
  const bitmap = await createImageBitmap(file);
  const value = bitmap[dimension];
  bitmap.close();
  return value;
}

export async function convertTextToPdf(textContent: string, fontSize = 11): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const size = Math.max(8, Math.min(24, fontSize));
  const margin = 48;
  const lineHeight = size * 1.45;
  const maxWidth = A4_WIDTH - margin * 2;
  const lines = textContent.replace(/\r\n?/g, "\n").split("\n").flatMap((line) => wrapText(line, font, size, maxWidth));
  const linesPerPage = Math.floor((A4_HEIGHT - margin * 2 - 24) / lineHeight);
  const pageCount = Math.max(1, Math.ceil(lines.length / linesPerPage));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = output.addPage([A4_WIDTH, A4_HEIGHT]);
    const pageLines = lines.slice(pageIndex * linesPerPage, (pageIndex + 1) * linesPerPage);
    pageLines.forEach((line, lineIndex) => {
      page.drawText(line, { x: margin, y: A4_HEIGHT - margin - size - lineIndex * lineHeight, size, font });
    });
    page.drawText(`${pageIndex + 1} / ${pageCount}`, { x: A4_WIDTH - margin - 42, y: 24, size: 8, font: bold });
  }
  return output.save();
}

function wrapText(line: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, fontSize: number, maxWidth: number) {
  if (!line) return [""];
  const words = line.split(/\s+/);
  const result: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else if (!current) {
      result.push(...splitLongWord(word, font, fontSize, maxWidth));
    } else {
      result.push(current);
      current = word;
    }
  }
  if (current) result.push(current);
  return result;
}

function splitLongWord(word: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, fontSize: number, maxWidth: number) {
  const parts: string[] = [];
  let current = "";
  for (const character of word) {
    if (current && font.widthOfTextAtSize(current + character, fontSize) > maxWidth) {
      parts.push(current);
      current = character;
    } else current += character;
  }
  if (current) parts.push(current);
  return parts;
}

export async function convertOfficeToPdf(file: File): Promise<Uint8Array> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return convertWorkbookToVectorPdf(workbook);
  }
  if (!file.name.toLowerCase().endsWith(".docx")) throw new Error("Choose a .docx, .xlsx, or .xls document.");

  const container = document.createElement("div");
  container.className = "office-render-surface";
  Object.assign(container.style, { position: "fixed", left: "-10000px", top: "0", width: "794px", background: "white", color: "#111", padding: "32px", zIndex: "-1" });
  document.body.append(container);
  try {
    await renderAsync(await file.arrayBuffer(), container);
    const canvas = await html2canvas(container, { scale: 1.5, backgroundColor: "#ffffff", useCORS: true, logging: false });
    return await canvasToPdfPages(canvas);
  } finally {
    container.remove();
  }
}

function convertWorkbookToVectorPdf(workbook: XLSX.WorkBook) {
  return (async () => {
    const output = await PDFDocument.create();
    const font = await output.embedFont(StandardFonts.Helvetica);
    const bold = await output.embedFont(StandardFonts.HelveticaBold);
    const margin = 36;
    const fontSize = 8;
    const lineHeight = 10;
    let page = output.addPage([A4_WIDTH, A4_HEIGHT]);
    let y = A4_HEIGHT - margin;

    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: true });
      const columnCount = Math.max(1, ...rows.map((row) => row.length));
      const columnWidth = (A4_WIDTH - margin * 2) / columnCount;
      page = output.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - margin;
      page.drawText(sheetName, { x: margin, y: y - 16, size: 14, font: bold });
      y -= 28;

      rows.forEach((row, rowIndex) => {
        const values = Array.from({ length: columnCount }, (_, columnIndex) => {
          const value = row[columnIndex];
          return value === null || value === undefined ? "" : String(value);
        });
        const wrapped = values.map((value) => wrapText(value, font, fontSize, Math.max(12, columnWidth - 8)));
        const rowHeight = Math.max(lineHeight + 5, ...wrapped.map((lines) => lines.length * lineHeight + 5));
        if (y - rowHeight < margin) {
          page = output.addPage([A4_WIDTH, A4_HEIGHT]);
          y = A4_HEIGHT - margin;
        }

        values.forEach((_, columnIndex) => {
          const x = margin + columnIndex * columnWidth;
          page.drawRectangle({ x, y: y - rowHeight, width: columnWidth, height: rowHeight, color: rowIndex === 0 ? rgb(0.91, 0.94, 0.91) : rgb(1, 1, 1), borderColor: rgb(0.78, 0.82, 0.78), borderWidth: 0.35 });
          wrapped[columnIndex].forEach((line, lineIndex) => page.drawText(line, { x: x + 4, y: y - 11 - lineIndex * lineHeight, size: fontSize, font: rowIndex === 0 ? bold : font, maxWidth: Math.max(8, columnWidth - 8) }));
        });
        y -= rowHeight;
      });
    }
    return output.save({ useObjectStreams: true });
  })();
}

async function canvasToPdfPages(canvas: HTMLCanvasElement) {
  const output = await PDFDocument.create();
  const pagePixelHeight = Math.floor(canvas.width * A4_HEIGHT / A4_WIDTH);
  for (let offsetY = 0; offsetY < canvas.height; offsetY += pagePixelHeight) {
    const crop = document.createElement("canvas");
    crop.width = canvas.width;
    crop.height = Math.min(pagePixelHeight, canvas.height - offsetY);
    const context = crop.getContext("2d");
    if (!context) throw new Error("Could not render the document page.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, crop.width, crop.height);
    context.drawImage(canvas, 0, offsetY, canvas.width, crop.height, 0, 0, crop.width, crop.height);
    const imageBytes = new Uint8Array(await (await new Promise<Blob>((resolve, reject) => crop.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode a document page.")), "image/jpeg", 0.9))).arrayBuffer());
    const image = await output.embedJpg(imageBytes);
    const page = output.addPage([A4_WIDTH, A4_HEIGHT]);
    const drawHeight = A4_WIDTH * crop.height / crop.width;
    page.drawImage(image, { x: 0, y: A4_HEIGHT - drawHeight, width: A4_WIDTH, height: drawHeight });
    crop.width = 0;
    crop.height = 0;
  }
  canvas.width = 0;
  canvas.height = 0;
  return output.save();
}
