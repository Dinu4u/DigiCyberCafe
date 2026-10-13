import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type RentReceiptInput = {
  tenantName: string;
  landlordName: string;
  landlordPan: string;
  address: string;
  monthlyRent: number;
  paymentMode: "Cash" | "UPI/Net Banking" | "Cheque";
  financialYearStart: number;
  startMonth: number;
  receiptCount?: 1 | 12;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function validateRentReceiptInput(input: RentReceiptInput) {
  if (!input.tenantName.trim() || !input.landlordName.trim() || !input.address.trim()) {
    throw new Error("Enter the tenant name, landlord name, and rented property address.");
  }
  if (!Number.isSafeInteger(input.monthlyRent) || input.monthlyRent < 1) {
    throw new Error("Enter a valid monthly rent amount in whole rupees.");
  }
  if (!Number.isInteger(input.financialYearStart) || input.financialYearStart < 2000 || input.financialYearStart > 2100) {
    throw new Error("Enter a financial year starting between 2000 and 2100.");
  }
  if (!Number.isInteger(input.startMonth) || input.startMonth < 0 || input.startMonth > 11) {
    throw new Error("Select a valid starting month.");
  }
  if (input.receiptCount !== undefined && input.receiptCount !== 1 && input.receiptCount !== 12) {
    throw new Error("Choose either one month's receipt or all 12 monthly receipts.");
  }
  if (input.monthlyRent * 12 > 100_000 && !PAN_PATTERN.test(input.landlordPan.trim().toUpperCase())) {
    throw new Error("Annual rent exceeds ₹1,00,000. Enter the landlord’s valid 10-character PAN to continue.");
  }
  if (input.landlordPan.trim() && !PAN_PATTERN.test(input.landlordPan.trim().toUpperCase())) {
    throw new Error("Enter a valid landlord PAN (for example, ABCDE1234F).");
  }
}

export async function generateRentReceipts(input: RentReceiptInput) {
  validateRentReceiptInput(input);
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const amountLabel = await pdf.embedPng(await makeTextImage(formatRupees(input.monthlyRent), "#17251c", 700, 40));
  const stampLabel = await pdf.embedPng(await makeTextImage("₹1 Revenue Stamp", "#3b443e", 500, 25));
  const annualThresholdApplies = input.monthlyRent * 12 > 100_000;
  const annualRent = formatRupees(input.monthlyRent * 12);
  const receiptCount = input.receiptCount ?? 12;
  const receiptsPerPage = receiptCount === 1 ? 1 : 4;
  const pageCount = Math.ceil(receiptCount / receiptsPerPage);
  const firstCalendarYear = input.financialYearStart + (input.startMonth < 3 ? 1 : 0);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (receiptsPerPage === 4) drawCutGuides(page);
    for (let receiptIndex = 0; receiptIndex < receiptsPerPage; receiptIndex += 1) {
      const sequence = pageIndex * receiptsPerPage + receiptIndex;
      if (sequence >= receiptCount) break;
      const monthIndex = (input.startMonth + sequence) % 12;
      const year = firstCalendarYear + Math.floor((input.startMonth + sequence) / 12);
      const singleReceipt = receiptsPerPage === 1;
      const column = singleReceipt ? 0 : receiptIndex % 2;
      const row = singleReceipt ? 0 : Math.floor(receiptIndex / 2);
      const margin = 28;
      const rect = singleReceipt
        ? { x: margin, y: margin, width: PAGE_WIDTH - margin * 2, height: PAGE_HEIGHT - margin * 2 }
        : { x: margin + column * (PAGE_WIDTH - margin * 2) / 2, y: PAGE_HEIGHT - margin - (row + 1) * (PAGE_HEIGHT - margin * 2) / 2, width: (PAGE_WIDTH - margin * 2) / 2, height: (PAGE_HEIGHT - margin * 2) / 2 };
      drawReceipt(page, rect, {
        input,
        sequence,
        month: MONTHS[monthIndex],
        year,
        scale: singleReceipt ? 2 : 1,
        annualThresholdApplies,
        annualRent,
        amountLabel,
        stampLabel,
        regular,
        bold,
      });
    }
  }

  return pdf.save({ useObjectStreams: true });
}

type Rect = { x: number; y: number; width: number; height: number };
type ReceiptLayout = {
  input: RentReceiptInput;
  sequence: number;
  month: string;
  year: number;
  scale: number;
  annualThresholdApplies: boolean;
  annualRent: string;
  amountLabel: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  stampLabel: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  regular: PDFFont;
  bold: PDFFont;
};

function drawCutGuides(page: PDFPage) {
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;
  const color = rgb(0.72, 0.75, 0.72);
  page.drawLine({ start: { x: 28, y: centerY }, end: { x: PAGE_WIDTH - 28, y: centerY }, color, thickness: 0.6, dashArray: [4, 3] });
  page.drawLine({ start: { x: centerX, y: 28 }, end: { x: centerX, y: PAGE_HEIGHT - 28 }, color, thickness: 0.6, dashArray: [4, 3] });
}

function drawReceipt(page: PDFPage, rect: Rect, data: ReceiptLayout) {
  const { input, regular, bold, scale } = data;
  const pad = 15 * scale;
  const left = rect.x + pad;
  const right = rect.x + rect.width - pad;
  const top = rect.y + rect.height - pad;
  const width = rect.width - pad * 2;
  page.drawRectangle({ ...rect, borderColor: rgb(0.6, 0.64, 0.6), borderWidth: 0.8 });

  page.drawText("RENT RECEIPT", { x: left, y: top - 13 * scale, size: 11 * scale, font: bold, color: rgb(0.16, 0.3, 0.2) });
  page.drawText(`Receipt No: ${String(data.sequence + 1).padStart(3, "0")}/${data.year}`, { x: left, y: top - 28 * scale, size: 7.5 * scale, font: regular });
  page.drawText(`${data.month} ${data.year}`, { x: right - regular.widthOfTextAtSize(`${data.month} ${data.year}`, 8 * scale), y: top - 28 * scale, size: 8 * scale, font: bold });
  page.drawLine({ start: { x: left, y: top - 35 * scale }, end: { x: right, y: top - 35 * scale }, color: rgb(0.83, 0.86, 0.83), thickness: 0.6 * scale });

  let y = top - 50 * scale;
  y = drawWrappedField(page, "Received from (Tenant)", input.tenantName, left, y, width, regular, bold, scale);
  y = drawWrappedField(page, "Landlord", input.landlordName, left, y, width, regular, bold, scale);
  y = drawWrappedField(page, "Landlord PAN", input.landlordPan.trim().toUpperCase() || "Not provided", left, y, width, regular, bold, scale);
  y = drawWrappedField(page, "Rented property address", input.address, left, y, width, regular, bold, scale);
  y = drawWrappedField(page, "Payment mode", input.paymentMode, left, y, width, regular, bold, scale);

  const amountY = y - 17 * scale;
  page.drawText("Amount received", { x: left, y: amountY, size: 7 * scale, font: regular, color: rgb(0.35, 0.39, 0.35) });
  const amountWidth = Math.min(width * 0.55, 120 * scale);
  const amountHeight = amountWidth * data.amountLabel.height / data.amountLabel.width;
  const amountImageY = amountY - 4 * scale - amountHeight;
  page.drawImage(data.amountLabel, { x: left, y: amountImageY, width: amountWidth, height: amountHeight });
  const wordsY = amountImageY - 13 * scale;
  page.drawText("In words:", { x: left, y: wordsY, size: 7 * scale, font: bold });
  drawWrappedText(page, numberToIndianWords(input.monthlyRent), left + 39 * scale, wordsY, width - 39 * scale, 7 * scale, regular);
  page.drawText(`For ${data.month} ${data.year}`, { x: left, y: wordsY - 18 * scale, size: 7.5 * scale, font: regular });

  if (data.annualThresholdApplies) {
    const note = `Section 10(13A): Annual rent ${data.annualRent.replace("₹", "INR ")} exceeds INR 1,00,000. Landlord PAN: ${input.landlordPan.trim().toUpperCase()}.`;
    drawWrappedText(page, note, left, wordsY - 33 * scale, width, 6.1 * scale, regular);
  }

  const stampX = right - 91 * scale;
  const stampY = rect.y + pad + 15 * scale;
  page.drawRectangle({ x: stampX, y: stampY, width: 91 * scale, height: 35 * scale, borderColor: rgb(0.66, 0.69, 0.66), borderWidth: 0.6 * scale });
  const stampWidth = 80 * scale;
  const stampHeight = stampWidth * data.stampLabel.height / data.stampLabel.width;
  page.drawImage(data.stampLabel, { x: stampX + 5 * scale, y: stampY + (35 * scale - stampHeight) / 2, width: stampWidth, height: stampHeight });
  const signatureRight = stampX - 10 * scale;
  const signatureWidth = signatureRight - left;
  const signatureLabel = "Landlord signature";
  const signatureLabelWidth = regular.widthOfTextAtSize(signatureLabel, 6.5 * scale);
  const signatureCenter = left + Math.max(0, signatureWidth - signatureLabelWidth) / 2;
  page.drawLine({ start: { x: left, y: stampY + 8 * scale }, end: { x: signatureRight, y: stampY + 8 * scale }, color: rgb(0.28, 0.31, 0.28), thickness: 0.6 * scale });
  page.drawText(signatureLabel, { x: signatureCenter, y: stampY - 2 * scale, size: 6.5 * scale, font: regular });
}

function drawWrappedField(page: PDFPage, label: string, value: string, x: number, y: number, width: number, regular: PDFFont, bold: PDFFont, scale: number) {
  page.drawText(`${label}:`, { x, y, size: 7 * scale, font: bold, color: rgb(0.25, 0.3, 0.26) });
  const lines = wrap(value.trim(), regular, 7 * scale, width - 5 * scale);
  lines.slice(0, 2).forEach((line, index) => page.drawText(line, { x: x + 5 * scale, y: y - 10 * scale - index * 9 * scale, size: 7 * scale, font: regular }));
  return y - 20 * scale - Math.max(0, Math.min(lines.length, 2) - 1) * 9 * scale;
}

function drawWrappedText(page: PDFPage, text: string, x: number, y: number, width: number, size: number, font: PDFFont) {
  wrap(text, font, size, width).slice(0, 2).forEach((line, index) => page.drawText(line, { x, y: y - index * (size + 2), size, font }));
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function numberToIndianWords(value: number) {
  if (value === 0) return "Rupees Zero Only";
  const small = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const underThousand = (n: number): string => {
    if (n < 20) return small[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${small[n % 10]}` : ""}`;
    return `${small[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${underThousand(n % 100)}` : ""}`;
  };
  const parts: string[] = [];
  let remaining = value;
  for (const [unit, divisor] of [["Crore", 10_000_000], ["Lakh", 100_000], ["Thousand", 1_000]] as const) {
    const count = Math.floor(remaining / divisor);
    if (count) parts.push(`${underThousand(count)} ${unit}`);
    remaining %= divisor;
  }
  if (remaining) parts.push(underThousand(remaining));
  return `Rupees ${parts.join(" ")} Only`;
}

async function makeTextImage(text: string, color: string, weight: number, size: number) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the rupee symbol for the PDF.");
  context.font = `${weight} ${size}px Arial, sans-serif`;
  canvas.width = Math.ceil(context.measureText(text).width) + 8;
  canvas.height = size + 8;
  context.font = `${weight} ${size}px Arial, sans-serif`;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.fillText(text, 4, canvas.height / 2);
  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}
