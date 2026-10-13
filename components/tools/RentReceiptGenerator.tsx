"use client";

import { useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { generateRentReceipts, type RentReceiptInput } from "@/lib/pdf/generateRentReceipts";
import { PdfThumbnail } from "@/components/tools/pdf/PdfThumbnail";
import styles from "./RentReceiptGenerator.module.css";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
type GeneratedPreview = { data: Uint8Array; receiptCount: 1 | 12; financialYearStart: number; startMonth: number };

export function RentReceiptGenerator() {
  const [tenantName, setTenantName] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPan, setLandlordPan] = useState("");
  const [address, setAddress] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [paymentMode, setPaymentMode] = useState<RentReceiptInput["paymentMode"]>("UPI/Net Banking");
  const [financialYearStart, setFinancialYearStart] = useState(currentYear - (new Date().getMonth() < 3 ? 1 : 0));
  const [startMonth, setStartMonth] = useState(3);
  const [receiptCount, setReceiptCount] = useState<1 | 12>(12);
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const annualRent = Number(monthlyRent) * 12;
  const panRequired = Number.isFinite(annualRent) && annualRent > 100_000;

  function downloadReceipts() {
    if (!preview) return;
    const url = createPdfUrl(preview.data);
    const link = document.createElement("a");
    link.href = url;
    const calendarYear = preview.financialYearStart + (preview.startMonth < 3 ? 1 : 0);
    link.download = preview.receiptCount === 1
      ? `hra-rent-receipt-${monthNames[preview.startMonth].toLowerCase()}-${calendarYear}.pdf`
      : `hra-rent-receipts-${preview.financialYearStart}-${preview.financialYearStart + 1}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openReceiptsForPrinting() {
    if (!preview) return;
    const url = createPdfUrl(preview.data);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      setError("Allow pop-ups for this site to open the printable PDF.");
      return;
    }
    printWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function createPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const input: RentReceiptInput = {
        tenantName,
        landlordName,
        landlordPan,
        address,
        monthlyRent: Number(monthlyRent),
        paymentMode,
        financialYearStart,
        startMonth,
        receiptCount,
      };
      const bytes = await generateRentReceipts(input);
      setPreview({ data: Uint8Array.from(bytes), receiptCount, financialYearStart, startMonth });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the rent receipts.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.generator}>
    <div className={styles.heading}>
      <h1>HRA Rent Receipt</h1>
    </div>

    <div className={styles.layout}>
      <form className={styles.form} onSubmit={(event) => void createPreview(event)}>
        <div className={styles.fieldGrid}>
          <fieldset className={`${styles.full} ${styles.receiptOptions}`}>
            <legend>Receipts to generate</legend>
            <label><input type="radio" name="receipt-count" checked={receiptCount === 1} onChange={() => setReceiptCount(1)} /><span>1 month</span></label>
            <label><input type="radio" name="receipt-count" checked={receiptCount === 12} onChange={() => setReceiptCount(12)} /><span>12 months</span></label>
          </fieldset>
          <label>Tenant full name<input required value={tenantName} onChange={(event) => setTenantName(event.target.value)} autoComplete="name" /></label>
          <label>Landlord full name<input required value={landlordName} onChange={(event) => setLandlordName(event.target.value)} /></label>
          <label className={styles.full}>Full rented property address<textarea required rows={3} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <label>Monthly rent (₹)<input required type="number" min="1" step="1" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} placeholder="e.g. 15000" /></label>
          <label>Payment mode<select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as RentReceiptInput["paymentMode"])}><option>UPI/Net Banking</option><option>Cash</option><option>Cheque</option></select></label>
          <label>Financial year start<input required type="number" min="2000" max="2100" value={financialYearStart} onChange={(event) => setFinancialYearStart(Number(event.target.value))} /></label>
          <label>{receiptCount === 1 ? "Receipt month" : "First receipt month"}<select value={startMonth} onChange={(event) => setStartMonth(Number(event.target.value))}>{monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}</select></label>
          <label className={styles.full}>Landlord PAN {panRequired ? <span className={styles.required}>Required</span> : <span className={styles.optional}>Optional</span>}
            <input value={landlordPan} onChange={(event) => setLandlordPan(event.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} autoCapitalize="characters" aria-required={panRequired} aria-invalid={panRequired && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(landlordPan)} />
          </label>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.generate} type="submit" disabled={busy}>{busy ? "Generating receipts…" : <><FileText size={17} /> Generate {receiptCount === 1 ? "1 Month Receipt" : "12 Receipts"} (PDF)</>}</button>
      </form>

      <section className={styles.preview} aria-label="PDF preview">
        <div className={styles.previewHeader}><strong>PDF preview</strong><div className={styles.previewActions}><button type="button" onClick={openReceiptsForPrinting} disabled={!preview}><Printer size={15} /> Print PDF</button><button type="button" onClick={downloadReceipts} disabled={!preview}><Download size={15} /> Download PDF</button></div></div>
        {preview ? <div className={styles.previewStage}>{Array.from({ length: preview.receiptCount === 1 ? 1 : 3 }, (_, index) => index + 1).map((pageNumber) => <PdfThumbnail key={pageNumber} data={preview.data} pageNumber={pageNumber} label={`Page ${pageNumber}`} className={styles.receiptThumbnail} />)}</div> : <div className={styles.empty}><FileText size={27} /><strong>Your PDF preview will appear here</strong></div>}
      </section>
    </div>
  </section>;
}

function createPdfUrl(data: Uint8Array) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
}
