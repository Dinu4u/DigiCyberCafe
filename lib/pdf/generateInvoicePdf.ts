import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { InvoiceFormState, InvoiceTotals } from "@/types/invoicing";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

function safeText(value: string): string {
  return value
    .replace(/[₹€£]/g, (symbol) => ({ "₹": "Rs ", "€": "EUR ", "£": "GBP " })[symbol] ?? symbol)
    .replace(/[^\x20-\x7E]/g, " ");
}

function money(value: number, currency: string): string {
  return safeText(
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value),
  );
}

function numberToWords(value: number): string {
  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const underThousand = (number: number): string => {
    if (number < 20) return ones[number];
    if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`;
    return `${ones[Math.floor(number / 100)]} hundred${number % 100 ? ` ${underThousand(number % 100)}` : ""}`;
  };

  if (!Number.isSafeInteger(value) || value < 0) return "Amount not available";
  if (value === 0) return "Zero";
  let remainder = value;
  const chunks: string[] = [];
  for (const [size, name] of [
    [1_000_000_000_000_000, "padma"],
    [100_000_000_000_000, "neel"],
    [10_000_000_000_000, "kharab"],
    [100_000_000_000, "arab"],
    [1_000_000_000, "billion"],
    [10_000_000, "crore"],
    [100_000, "lakh"],
    [1_000, "thousand"],
    [1, ""],
  ] as const) {
    const count = Math.floor(remainder / size);
    remainder %= size;
    if (count) chunks.push(`${underThousand(count)}${name ? ` ${name}` : ""}`);
  }
  return chunks.join(" ").replace(/^./, (letter) => letter.toUpperCase());
}

function amountInWords(value: number, currency: string): string {
  let major = Math.floor(value);
  let minor = Math.round((value - major) * 100);
  if (minor === 100) {
    major += 1;
    minor = 0;
  }
  const units: Record<string, [string, string]> = {
    INR: ["rupees", "paise"],
    USD: ["dollars", "cents"],
    EUR: ["euros", "cents"],
    GBP: ["pounds", "pence"],
  };
  const [majorUnit, minorUnit] = units[currency] ?? [currency, "minor units"];
  const majorWords = `${numberToWords(major)} ${majorUnit}`;
  return minor > 0 ? `${majorWords} and ${numberToWords(minor).toLowerCase()} ${minorUnit}` : majorWords;
}

function drawWrappedText(
  page: Awaited<ReturnType<PDFDocument["addPage"]>>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  lineHeight = size + 3,
): number {
  const words = safeText(text).split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.18, 0.22, 0.19) });
      cursorY -= lineHeight;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.18, 0.22, 0.19) });
  return cursorY;
}

export async function generateInvoicePdf(
  invoice: InvoiceFormState,
  totals: InvoiceTotals,
  qrDataUrl: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const black = rgb(0.12, 0.15, 0.13);
  const muted = rgb(0.40, 0.44, 0.41);
  const lineColor = rgb(0.78, 0.81, 0.78);
  const title = {
    INVOICE: "INVOICE",
    QUOTATION_ESTIMATE: "QUOTATION / ESTIMATE",
    PROFORMA: "PROFORMA INVOICE",
    DELIVERY_CHALLAN: "DELIVERY CHALLAN",
  }[invoice.documentType];

  page.drawText(title, { x: MARGIN, y: PAGE_HEIGHT - 58, size: 20, font: bold, color: black });
  page.drawText(safeText(invoice.documentNumber), {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(safeText(invoice.documentNumber), 11),
    y: PAGE_HEIGHT - 53,
    size: 11,
    font: bold,
    color: muted,
  });
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 72 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 72 },
    thickness: 1,
    color: black,
  });

  let businessTextX = MARGIN;
  if (invoice.business.logoDataUrl) {
    const [header, data] = invoice.business.logoDataUrl.split(",");
    if (!header || !data) throw new Error("Business logo data is invalid.");
    const logoBytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
    const logo = header.includes("image/png")
      ? await pdf.embedPng(logoBytes)
      : header.includes("image/jpeg")
        ? await pdf.embedJpg(logoBytes)
        : null;
    if (!logo) throw new Error("Only PNG or JPG logos can be embedded.");
    const scale = Math.min(48 / logo.width, 48 / logo.height);
    page.drawImage(logo, { x: MARGIN, y: PAGE_HEIGHT - 130, width: logo.width * scale, height: logo.height * scale });
    businessTextX += 58;
  }
  page.drawText(safeText(invoice.business.name || "Your business"), {
    x: businessTextX,
    y: PAGE_HEIGHT - 98,
    size: 14,
    font: bold,
    color: black,
  });
  let businessY = PAGE_HEIGHT - 114;
  for (const value of [
    invoice.business.address,
    invoice.business.phone,
    invoice.business.email,
    invoice.business.taxId ? `Tax ID: ${invoice.business.taxId}` : "",
  ].filter(Boolean)) {
    businessY = drawWrappedText(page, value, businessTextX, businessY, 250, regular, 8, 11) - 3;
  }

  const dateX = PAGE_WIDTH - MARGIN - 146;
  page.drawText("ISSUED", { x: dateX, y: PAGE_HEIGHT - 98, size: 8, font: bold, color: muted });
  page.drawText(safeText(invoice.issueDate), { x: dateX, y: PAGE_HEIGHT - 111, size: 9, font: regular, color: black });
  if (invoice.dueDate) {
    page.drawText("DUE", { x: dateX, y: PAGE_HEIGHT - 130, size: 8, font: bold, color: muted });
    page.drawText(safeText(invoice.dueDate), { x: dateX, y: PAGE_HEIGHT - 143, size: 9, font: regular, color: black });
  }

  const partyTop = PAGE_HEIGHT - 174;
  page.drawText("BILL TO", { x: MARGIN, y: partyTop, size: 8, font: bold, color: muted });
  page.drawText(safeText(invoice.client.name || "Client"), { x: MARGIN, y: partyTop - 16, size: 11, font: bold, color: black });
  let clientY = partyTop - 30;
  for (const value of [
    invoice.client.address,
    invoice.client.phone,
    invoice.client.email,
    invoice.client.taxId ? `Tax ID: ${invoice.client.taxId}` : "",
  ].filter(Boolean)) {
    clientY = drawWrappedText(page, value, MARGIN, clientY, 270, regular, 8, 11) - 2;
  }

  const tableTop = Math.min(clientY - 22, PAGE_HEIGHT - 264);
  const columns = [MARGIN, 70, 321, 375, 438, PAGE_WIDTH - MARGIN];
  page.drawRectangle({
    x: MARGIN,
    y: tableTop - 19,
    width: PAGE_WIDTH - 2 * MARGIN,
    height: 22,
    color: rgb(0.94, 0.95, 0.94),
  });
  const headings = [
    { text: "#", x: columns[0] + 5 },
    { text: "DESCRIPTION", x: columns[1] + 5 },
    { text: "QTY", x: columns[2] + 5 },
    { text: "RATE", x: columns[3] + 5 },
    { text: "AMOUNT", x: columns[4] + 5 },
  ];
  headings.forEach(({ text, x }) => page.drawText(text, { x, y: tableTop - 11, size: 7, font: bold, color: black }));

  let rowY = tableTop - 39;
  const pdfItems = [
    ...invoice.items.map((item) => ({
      description: `${item.description || "Item"}${item.hsnSac ? ` | HSN/SAC ${item.hsnSac}` : ""}`,
      quantity: `${item.quantity} ${safeText(item.unit)}`,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    })),
    ...(invoice.visitingCharge > 0
      ? [{ description: "Visiting charge", quantity: "1", unitPrice: invoice.visitingCharge, amount: invoice.visitingCharge }]
      : []),
  ];
  for (const [index, item] of pdfItems.entries()) {
    if (rowY < 300) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawText(`${title} (continued)`, { x: MARGIN, y: PAGE_HEIGHT - 50, size: 12, font: bold, color: black });
      page.drawText(safeText(invoice.documentNumber), { x: MARGIN, y: PAGE_HEIGHT - 68, size: 9, font: regular, color: muted });
      const continuedTop = PAGE_HEIGHT - 88;
      page.drawRectangle({
        x: MARGIN,
        y: continuedTop - 19,
        width: PAGE_WIDTH - 2 * MARGIN,
        height: 22,
        color: rgb(0.94, 0.95, 0.94),
      });
      headings.forEach(({ text, x }) => page.drawText(text, { x, y: continuedTop - 11, size: 7, font: bold, color: black }));
      rowY = continuedTop - 39;
    }
    page.drawText(String(index + 1), { x: columns[0] + 5, y: rowY, size: 8, font: regular, color: black });
    drawWrappedText(page, item.description, columns[1] + 5, rowY, 240, regular, 8, 10);
    page.drawText(item.quantity, { x: columns[2] + 5, y: rowY, size: 8, font: regular, color: black });
    page.drawText(money(item.unitPrice, invoice.currency), { x: columns[3] + 5, y: rowY, size: 8, font: regular, color: black });
    page.drawText(money(item.amount, invoice.currency), { x: columns[4] + 5, y: rowY, size: 8, font: regular, color: black });
    page.drawLine({
      start: { x: MARGIN, y: rowY - 9 },
      end: { x: PAGE_WIDTH - MARGIN, y: rowY - 9 },
      thickness: 0.5,
      color: lineColor,
    });
    rowY -= 25;
  }

  const totalsY = rowY - 12;
  const totalsX = PAGE_WIDTH - MARGIN - 180;
  const drawTotal = (label: string, value: number, y: number, emphasized = false) => {
    page.drawText(label, { x: totalsX, y, size: emphasized ? 10 : 8, font: emphasized ? bold : regular, color: black });
    const valueText = money(value, invoice.currency);
    page.drawText(valueText, {
      x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(valueText, emphasized ? 10 : 8),
      y,
      size: emphasized ? 10 : 8,
      font: emphasized ? bold : regular,
      color: black,
    });
  };
  drawTotal("Subtotal", totals.subtotal, totalsY);
  drawTotal("Discount", -totals.discountAmount, totalsY - 14);
  if (invoice.taxType !== "NONE") drawTotal(`${invoice.taxType} (${invoice.taxRate}%)`, totals.taxAmount, totalsY - 28);
  if (invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST") {
    drawTotal("CGST", totals.cgst, totalsY - 42);
    drawTotal("SGST", totals.sgst, totalsY - 56);
  }
  drawTotal("GRAND TOTAL", totals.grandTotal, totalsY - (invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST" ? 76 : 48), true);

  const wordsY = totalsY - (invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST" ? 96 : 68);
  page.drawText("Amount in words:", { x: MARGIN, y: wordsY, size: 8, font: bold, color: muted });
  drawWrappedText(page, amountInWords(totals.grandTotal, invoice.currency), MARGIN, wordsY - 13, 280, regular, 8, 11);

  if (invoice.visitingCharge > 0) {
    page.drawText(`Visiting charge included: ${money(invoice.visitingCharge, invoice.currency)}`, {
      x: MARGIN,
      y: wordsY - 34,
      size: 8,
      font: regular,
      color: muted,
    });
  }
  if (invoice.warrantyTerms) {
    drawWrappedText(page, `Warranty: ${invoice.warrantyTerms}`, MARGIN, wordsY - 49, 300, regular, 8, 11);
  }
  if (invoice.notes) {
    drawWrappedText(page, `Notes: ${invoice.notes}`, MARGIN, wordsY - 68, 300, regular, 8, 11);
  }
  const bankLines = [
    invoice.business.upiId ? `UPI: ${invoice.business.upiId}` : "",
    invoice.business.bankName ? `Bank: ${invoice.business.bankName}` : "",
    invoice.business.accountName ? `Account name: ${invoice.business.accountName}` : "",
    invoice.business.accountNumber ? `Account: ${invoice.business.accountNumber}` : "",
    invoice.business.ifsc ? `IFSC: ${invoice.business.ifsc}` : "",
    invoice.business.swift ? `SWIFT: ${invoice.business.swift}` : "",
  ].filter(Boolean);
  if (bankLines.length) {
    let y = wordsY - 96;
    page.drawText("PAYMENT DETAILS", { x: MARGIN, y, size: 8, font: bold, color: muted });
    y -= 13;
    for (const detail of bankLines) {
      page.drawText(safeText(detail), { x: MARGIN, y, size: 8, font: regular, color: black });
      y -= 11;
    }
  }

  if (qrDataUrl && invoice.business.upiId) {
    const qrBytes = Uint8Array.from(atob(qrDataUrl.split(",")[1] ?? ""), (character) => character.charCodeAt(0));
    const qr = await pdf.embedPng(qrBytes);
    const qrSize = 78;
    page.drawImage(qr, { x: PAGE_WIDTH - MARGIN - qrSize, y: Math.max(55, wordsY - 105), width: qrSize, height: qrSize });
    page.drawText("SCAN TO PAY", {
      x: PAGE_WIDTH - MARGIN - qrSize,
      y: Math.max(42, wordsY - 118),
      size: 7,
      font: bold,
      color: muted,
    });
  }

  page.drawLine({
    start: { x: MARGIN, y: 35 },
    end: { x: PAGE_WIDTH - MARGIN, y: 35 },
    thickness: 0.5,
    color: lineColor,
  });
  page.drawText("Generated privately in your browser", {
    x: MARGIN,
    y: 22,
    size: 7,
    font: regular,
    color: muted,
  });

  return pdf.save();
}
