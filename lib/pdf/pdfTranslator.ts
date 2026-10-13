import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";

export type ExtractedPdfPage = { pageNumber: number; text: string };
export type TranslationProgress = { pageCurrent: number; pageTotal: number };

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const FONT_URLS: Record<string, string> = {
  Latin: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf",
  Devanagari: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf",
  Bengali: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf",
  Arabic: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf",
  Tamil: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstamil/NotoSansTamil%5Bwdth%2Cwght%5D.ttf",
  Telugu: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstelugu/NotoSansTelugu%5Bwdth%2Cwght%5D.ttf",
};
const fontCache = new Map<string, Uint8Array>();

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdfPage[]> {
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const document = await loadingTask.promise;
  try {
    const pages: ExtractedPdfPage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines: Array<{ y: number; endX: number; text: string }> = [];
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const y = item.transform[5];
        const x = item.transform[4];
        const previous = lines.at(-1);
        if (previous && Math.abs(previous.y - y) <= 3) {
          const gap = x - previous.endX;
          previous.text += `${gap > 1.5 && !previous.text.endsWith(" ") ? " " : ""}${item.str}`;
          previous.endX = x + item.width;
        } else {
          lines.push({ y, endX: x + item.width, text: item.str });
        }
      }
      page.cleanup();
      pages.push({ pageNumber, text: lines.reverse().map((line) => line.text.trim()).join("\n") });
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

export async function translatePdfPages(pages: ExtractedPdfPage[], sourceLanguage: string, targetLanguage: string, onProgress?: (progress: TranslationProgress) => void) {
  const translated: ExtractedPdfPage[] = [];
  for (const [index, page] of pages.entries()) {
    const chunks = splitTextIntoChunks(page.text, 420);
    const translatedChunks: string[] = [];
    for (const chunk of chunks) {
      translatedChunks.push(await translateTextChunk(chunk, sourceLanguage, targetLanguage));
    }
    translated.push({ pageNumber: page.pageNumber, text: translatedChunks.join("\n") });
    onProgress?.({ pageCurrent: index + 1, pageTotal: pages.length });
  }
  return translated;
}

async function translateTextChunk(text: string, sourceLanguage: string, targetLanguage: string) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
  });
  let result: { translatedText?: string; error?: string };
  try {
    result = await response.json() as { translatedText?: string; error?: string };
  } catch {
    throw new Error("The translation service returned an invalid response. Please try again.");
  }
  if (!response.ok || !result.translatedText) {
    throw new Error(result.error ?? "The translation service could not translate this text. Please try again later.");
  }
  return decodeHtmlEntities(result.translatedText);
}

function splitTextIntoChunks(text: string, maximumLength: number) {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= maximumLength) current = candidate;
    else {
      if (current) chunks.push(current);
      if (line.length <= maximumLength) current = line;
      else {
        let remainder = line;
        while (remainder.length > maximumLength) {
          const splitAt = remainder.lastIndexOf(" ", maximumLength);
          const index = splitAt > 0 ? splitAt : maximumLength;
          chunks.push(remainder.slice(0, index));
          remainder = remainder.slice(index).trimStart();
        }
        current = remainder;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function createTranslatedPdf(sourceBuffer: ArrayBuffer, pages: ExtractedPdfPage[], language: string, customFont?: ArrayBuffer) {
  const source = await PDFDocument.load(sourceBuffer);
  const output = await PDFDocument.create();
  output.registerFontkit(fontkit);
  const fontBytes = customFont ? new Uint8Array(customFont) : await fetchNotoFont(language);
  const font = await output.embedFont(fontBytes, { subset: true });
  const sourcePages = source.getPages();
  const margin = 42;
  const fontSize = 10;
  const lineHeight = 14;

  pages.forEach((pageText, index) => {
    const sourcePage = sourcePages[index];
    const { width, height } = sourcePage?.getSize() ?? { width: A4_WIDTH, height: A4_HEIGHT };
    const pageWidth = width || A4_WIDTH;
    const pageHeight = height || A4_HEIGHT;
    const pageLines = wrapTranslatedText(pageText.text, font, fontSize, Math.max(100, pageWidth - margin * 2));
    const linesPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / lineHeight));
    const pageCount = Math.max(1, Math.ceil(pageLines.length / linesPerPage));

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = output.addPage([pageWidth, pageHeight]);
      const lines = pageLines.slice(pageIndex * linesPerPage, (pageIndex + 1) * linesPerPage);
      drawTranslatedLines(page, lines, font, fontSize, lineHeight, margin);
    }
  });

  return output.save({ useObjectStreams: true });
}

async function fetchNotoFont(language: string) {
  const script = scriptForLanguage(language);
  const url = FONT_URLS[script];
  const cached = fontCache.get(url);
  if (cached) return cached;
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("Could not load a Noto Sans font. Upload a TTF or OTF font to continue.");
  const fontBytes = new Uint8Array(await response.arrayBuffer());
  fontCache.set(url, fontBytes);
  return fontBytes;
}

function scriptForLanguage(language: string) {
  if (["hi", "mr"].includes(language)) return "Devanagari";
  if (["bn"].includes(language)) return "Bengali";
  if (["ar"].includes(language)) return "Arabic";
  if (["ta"].includes(language)) return "Tamil";
  if (["te"].includes(language)) return "Telugu";
  return "Latin";
}

function wrapTranslatedText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  return text.split("\n").flatMap((line) => {
    if (!line) return [""];
    const wrapped: string[] = [];
    let current = "";
    for (const word of line.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) current = next;
      else if (!current) {
        wrapped.push(word);
      } else {
        wrapped.push(current);
        current = word;
      }
    }
    if (current) wrapped.push(current);
    return wrapped;
  });
}

function drawTranslatedLines(page: PDFPage, lines: string[], font: PDFFont, fontSize: number, lineHeight: number, margin: number) {
  const { height } = page.getSize();
  lines.forEach((line, index) => page.drawText(line, { x: margin, y: height - margin - fontSize - index * lineHeight, size: fontSize, font }));
}

function decodeHtmlEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}