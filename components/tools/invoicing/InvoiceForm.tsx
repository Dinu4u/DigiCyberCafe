"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import InvoiceLivePreview from "@/components/tools/invoicing/InvoiceLivePreview";
import { generateInvoicePdf } from "@/lib/pdf/generateInvoicePdf";
import type {
  InvoiceBusinessProfile,
  InvoiceCurrency,
  InvoiceDocumentType,
  InvoiceFormState,
  InvoiceGstMode,
  InvoiceLineItem,
  InvoiceParty,
  InvoicePersona,
  InvoiceTotals,
} from "@/types/invoicing";

const STORAGE_KEY = "ecybercafe.invoice.business-profile.v1";
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const newId = () => globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyParty = (): InvoiceParty => ({ name: "", phone: "", address: "", email: "", taxId: "" });
const emptyBusiness = (): InvoiceBusinessProfile => ({
  ...emptyParty(),
  upiId: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  swift: "",
  logoDataUrl: "",
});
const initialState = (): InvoiceFormState => ({
  documentType: "QUOTATION_ESTIMATE",
  documentNumber: `EST-${new Date().getFullYear()}-0001`,
  issueDate: today(),
  dueDate: "",
  persona: "GENERAL",
  freelancerRateMode: "HOURLY",
  currency: "INR",
  business: emptyBusiness(),
  client: emptyParty(),
  items: [],
  discountType: "PERCENT",
  discountValue: 0,
  taxType: "GST",
  taxRate: 18,
  gstMode: "CGST_SGST",
  visitingCharge: 0,
  warrantyTerms: "",
  notes: "",
});

type AppError = { title: string; message: string; nextStep: string } | null;
const errorMessages = {
  items: {
    title: "No billable items found.",
    message: "Please enter at least one item description, quantity, and unit price before generating the document.",
    nextStep: "",
  },
  numeric: {
    title: "Invalid numeric values detected.",
    message: "Ensure all quantities, rates, discounts, and taxes are positive numbers.",
    nextStep: "",
  },
  logo: {
    title: "Business logo is too large for fast PDF compilation.",
    message: "Please upload a PNG or JPG logo under 2MB. The tool will auto-scale it to fit the header.",
    nextStep: "",
  },
  storage: {
    title: "Local autosave is disabled in private/incognito mode.",
    message: "You can still create and download your invoice, but your business details will not be remembered for next time.",
    nextStep: "",
  },
} as const;

function calculateTotals(invoice: InvoiceFormState): InvoiceTotals {
  const numbers = [
    invoice.discountValue,
    invoice.taxRate,
    invoice.visitingCharge,
    ...invoice.items.flatMap((item) => [item.quantity, item.unitPrice]),
  ];
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("All quantities, rates, discounts, taxes, and charges must be non-negative finite numbers.");
  }
  if (
    invoice.items.some(
      (item) => item.description.trim() && (item.quantity <= 0 || item.unitPrice <= 0),
    )
  ) {
    throw new Error("Each billable item must have a positive quantity and unit price.");
  }
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + invoice.visitingCharge;
  if (!Number.isFinite(subtotal) || subtotal > Number.MAX_SAFE_INTEGER) throw new Error("Invoice total exceeds the supported display range.");
  const discountAmount = Math.min(
    subtotal,
    invoice.discountType === "PERCENT"
      ? subtotal * (invoice.discountValue / 100)
      : invoice.discountValue,
  );
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = invoice.taxType === "NONE" ? 0 : taxableAmount * (invoice.taxRate / 100);
  const grandTotal = taxableAmount + taxAmount;
  if (![discountAmount, taxableAmount, taxAmount, grandTotal].every(Number.isFinite) || grandTotal > Number.MAX_SAFE_INTEGER) {
    throw new Error("Calculated invoice total is outside the supported number range.");
  }
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    cgst: invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST" ? taxAmount / 2 : 0,
    sgst: invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST" ? taxAmount / 2 : 0,
    grandTotal,
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
  required = false,
  className = "",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ErrorAlert({ error }: { error: AppError }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      <p className="font-semibold">{error.title}</p>
      <p className="mt-1">{error.message}</p>
      {error.nextStep && <p className="mt-1 text-rose-800">{error.nextStep}</p>}
    </div>
  );
}

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const headingClass = "text-base font-semibold text-slate-900";
const documentOptions: { value: InvoiceDocumentType; label: string }[] = [
  { value: "QUOTATION_ESTIMATE", label: "Quotation / Estimate" },
  { value: "INVOICE", label: "Invoice" },
  { value: "PROFORMA", label: "Proforma Invoice" },
  { value: "DELIVERY_CHALLAN", label: "Delivery Challan" },
];
const currencyOptions: { value: InvoiceCurrency; label: string }[] = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];
const personaOptions: { value: InvoicePersona; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "TRADESPERSON", label: "Tradesperson" },
  { value: "TRADER_RETAIL", label: "Trader / Retail" },
];

const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "United States / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+92", country: "Pakistan" },
  { code: "+977", country: "Nepal" },
  { code: "+880", country: "Bangladesh" },
  { code: "+94", country: "Sri Lanka" },
];

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedCode = countryCodes.find(({ code }) => value.startsWith(`${code} `) || value === code)?.code ?? "+91";
  const nationalNumber = value.startsWith(selectedCode)
    ? value.slice(selectedCode.length).trim()
    : value;

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="mt-1.5 flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <select
          aria-label={`${label} country code`}
          value={selectedCode}
          onChange={(event) => {
            const number = nationalNumber.trim();
            onChange(number ? `${event.target.value} ${number}` : "");
          }}
          className="max-w-32 border-r border-slate-300 bg-slate-50 px-2 py-2 text-slate-800 outline-none"
        >
          {countryCodes.map(({ code, country }) => (
            <option key={code} value={code}>{`${code} ${country}`}</option>
          ))}
        </select>
        <input
          type="tel"
          aria-label={`${label} number`}
          inputMode="tel"
          autoComplete="tel-national"
          value={nationalNumber}
          onChange={(event) => {
            const number = event.target.value;
            onChange(number ? `${selectedCode} ${number}` : "");
          }}
          className="min-w-0 flex-1 px-3 py-2 text-slate-900 outline-none"
        />
      </span>
    </label>
  );
}

export default function InvoiceForm() {
  const [invoice, setInvoice] = useState<InvoiceFormState>(initialState);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [error, setError] = useState<AppError>(null);
  const [notice, setNotice] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved: unknown = JSON.parse(raw);
        if (!saved || typeof saved !== "object") throw new Error("Saved business profile is invalid.");
        const record = saved as { business?: Partial<InvoiceBusinessProfile>; recurringItems?: InvoiceLineItem[] };
        setInvoice((current) => ({
          ...current,
          business: { ...current.business, ...record.business },
          items: Array.isArray(record.recurringItems) ? record.recurringItems : current.items,
        }));
      } catch {
        setStorageBlocked(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const totalsResult = useMemo(() => {
    try {
      return { totals: calculateTotals(invoice), message: "" };
    } catch (caught) {
      return { totals: null, message: caught instanceof Error ? caught.message : "Could not calculate the invoice totals." };
    }
  }, [invoice]);

  useEffect(() => {
    let active = true;
    if (invoice.currency !== "INR" || !invoice.business.upiId.trim() || !totalsResult.totals || totalsResult.totals.grandTotal <= 0) {
      Promise.resolve().then(() => { if (active) setQrDataUrl(""); });
      return () => { active = false; };
    }
    const paymentUri = `upi://pay?pa=${encodeURIComponent(invoice.business.upiId.trim())}&pn=${encodeURIComponent(invoice.business.name || "Payee")}&am=${totalsResult.totals.grandTotal.toFixed(2)}&cu=${invoice.currency}&tn=${encodeURIComponent(invoice.documentNumber)}`;
    Promise.resolve().then(() => { if (active) setQrDataUrl(""); });
    QRCode.toDataURL(paymentUri, { errorCorrectionLevel: "M", margin: 1, width: 240 })
      .then((dataUrl) => { if (active) setQrDataUrl(dataUrl); })
      .catch(() => { if (active) setError({ title: "Could not create the payment QR code.", message: "Check the UPI ID and try again.", nextStep: "" }); });
    return () => { active = false; };
  }, [invoice.business.name, invoice.business.upiId, invoice.currency, invoice.documentNumber, totalsResult.totals]);

  const saveBusiness = (business: InvoiceBusinessProfile, recurringItems: InvoiceLineItem[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ business, recurringItems }));
      setStorageBlocked(false);
    } catch {
      setStorageBlocked(true);
    }
  };
  const updateBusiness = (key: keyof InvoiceBusinessProfile, value: string) => {
    const business = { ...invoice.business, [key]: value };
    setInvoice((current) => ({ ...current, business }));
    saveBusiness(business, invoice.items);
  };
  const updateClient = (key: keyof InvoiceParty, value: string) =>
    setInvoice((current) => ({ ...current, client: { ...current.client, [key]: value } }));
  const updateItem = (id: string, key: keyof InvoiceLineItem, value: string) => {
    const items = invoice.items.map((item) =>
      item.id === id
        ? { ...item, [key]: key === "quantity" || key === "unitPrice" ? (value === "" ? 0 : Number(value)) : value }
        : item,
    );
    setInvoice((current) => ({ ...current, items }));
    saveBusiness(invoice.business, items);
  };
  const addItem = (kind: InvoiceLineItem["kind"] = "GENERAL") => {
    const unit = invoice.persona === "FREELANCER"
      ? invoice.freelancerRateMode === "HOURLY" ? "Hr" : "Service"
      : "Pcs";
    const items = [...invoice.items, { id: newId(), description: "", quantity: 1, unitPrice: 0, unit, hsnSac: "", kind }];
    setInvoice((current) => ({ ...current, items }));
    saveBusiness(invoice.business, items);
    setItemsOpen(true);
  };
  const removeItem = (id: string) => {
    const items = invoice.items.filter((item) => item.id !== id);
    setInvoice((current) => ({ ...current, items }));
    saveBusiness(invoice.business, items);
  };
  const patchInvoice = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) =>
    setInvoice((current) => ({ ...current, [key]: value }));

  const validateDocument = (): InvoiceTotals | null => {
    if (!totalsResult.totals) {
      setError({ title: "Invalid numeric values detected.", message: totalsResult.message, nextStep: errorMessages.numeric.nextStep });
      return null;
    }
    if (!invoice.items.some((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)) {
      setError(errorMessages.items);
      return null;
    }
    setError(null);
    return totalsResult.totals;
  };

  const makePdf = async () => {
    const totals = validateDocument();
    if (!totals) return null;
    try {
      setIsWorking(true);
      const paymentQr = invoice.currency === "INR" && invoice.business.upiId.trim()
        ? await QRCode.toDataURL(
          `upi://pay?pa=${encodeURIComponent(invoice.business.upiId.trim())}&pn=${encodeURIComponent(invoice.business.name || "Payee")}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.documentNumber)}`,
          { errorCorrectionLevel: "M", margin: 1, width: 240 },
        )
        : "";
      const bytes = await generateInvoicePdf(invoice, totals, paymentQr);
      return new Blob([bytes as BlobPart], { type: "application/pdf" });
    } catch (caught) {
      setError({
        title: "Could not generate the document.",
        message: caught instanceof Error ? caught.message : "An unexpected PDF generation error occurred.",
        nextStep: "Check the entered details and try again.",
      });
      return null;
    } finally {
      setIsWorking(false);
    }
  };

  const downloadPdf = async () => {
    const blob = await makePdf();
    if (!blob) return;
    try {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.documentNumber || "document"}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setNotice("PDF downloaded.");
    } catch {
      setError({ title: "Could not download the PDF.", message: "Your browser blocked the file download.", nextStep: "Allow downloads for this page and try again." });
    }
  };

  const printPdf = async () => {
    const blob = await makePdf();
    if (!blob) return;
    try {
      const url = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      frame.title = "Invoice PDF print view";
      frame.style.position = "fixed";
      frame.style.width = "1px";
      frame.style.height = "1px";
      frame.style.opacity = "0";
      frame.src = url;
      frame.onload = () => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          setError({ title: "Could not open the print dialog.", message: "This browser does not allow printing the generated document.", nextStep: "Download the PDF and print it from your PDF viewer." });
        } finally {
          window.setTimeout(() => {
            frame.remove();
            URL.revokeObjectURL(url);
          }, 60_000);
        }
      };
      document.body.appendChild(frame);
    } catch {
      setError({ title: "Could not open the print dialog.", message: "This browser does not allow printing the generated document.", nextStep: "Download the PDF and print it from your PDF viewer." });
    }
  };

  const shareDocument = async () => {
    const blob = await makePdf();
    if (!blob) return;
    const summary = `${invoice.documentType === "QUOTATION_ESTIMATE" ? "Quotation" : "Invoice"} ${invoice.documentNumber} from ${invoice.business.name || "us"}. Total: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency, maximumFractionDigits: 2 }).format(totalsResult.totals?.grandTotal ?? 0)}.`;
    try {
      const file = new File([blob], `${invoice.documentNumber || "document"}.pdf`, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: invoice.documentNumber, text: summary, files: [file] });
        setNotice("Document shared.");
        return;
      }
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${invoice.documentNumber || "document"}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30_000);
      window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank", "noopener,noreferrer");
      setNotice("PDF downloaded and WhatsApp opened with the summary. Attach the PDF to send the file.");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError({ title: "Could not share the document.", message: caught instanceof Error ? caught.message : "The browser could not share this PDF.", nextStep: "Download the PDF and attach it in WhatsApp." });
    }
  };

  const convertToInvoice = () => {
    try {
      const serial = String(Date.now()).slice(-8);
      setInvoice((current) => ({
        ...current,
        documentType: "INVOICE",
        documentNumber: `INV-${new Date().getFullYear()}-${serial}`,
      }));
      setNotice("Converted to an invoice. All line items and details have been kept.");
    } catch {
      setError({ title: "Could not convert the quotation.", message: "The document number could not be generated.", nextStep: "Please try again." });
    }
  };

  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg"].includes(file.type)) {
      setError(errorMessages.logo);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError(errorMessages.logo);
        return;
      }
      const image = new Image();
      image.onload = () => {
        updateBusiness("logoDataUrl", reader.result as string);
        setError(null);
      };
      image.onerror = () => setError(errorMessages.logo);
      image.src = reader.result;
    };
    reader.onerror = () => setError(errorMessages.logo);
    reader.readAsDataURL(file);
  };

  const changePersona = (persona: InvoicePersona) => {
    setInvoice((current) => {
      const nextItems = current.items.map((item) => ({
        ...item,
        kind: persona === "TRADESPERSON" && item.kind === "GENERAL" ? "MATERIAL" as const : item.kind,
      }));
      return { ...current, persona, items: nextItems };
    });
  };

  return (
    <div className="space-y-6">
      <div data-invoice-controls className="space-y-6 print:hidden">
          {storageBlocked && <ErrorAlert error={errorMessages.storage} />}
        {notice && <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        <section className={cardClass}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Document type" value={invoice.documentType} options={documentOptions} onChange={(value) => patchInvoice("documentType", value)} />
            <Field label="Document number" value={invoice.documentNumber} onChange={(value) => patchInvoice("documentNumber", value)} />
            <Field label="Issue date" type="date" value={invoice.issueDate} onChange={(value) => patchInvoice("issueDate", value)} />
            <Field label="Due date (optional)" type="date" value={invoice.dueDate} onChange={(value) => patchInvoice("dueDate", value)} />
            <Select label="Business type" value={invoice.persona} options={personaOptions} onChange={changePersona} />
            <Select label="Currency" value={invoice.currency} options={currencyOptions} onChange={(value) => patchInvoice("currency", value)} />
          </div>
          {invoice.persona === "FREELANCER" && (
            <div className="mt-4 max-w-xs">
              <Select
                label="Billing style"
                value={invoice.freelancerRateMode}
                options={[{ value: "HOURLY", label: "Hourly" }, { value: "FIXED", label: "Fixed price" }]}
                onChange={(value) => patchInvoice("freelancerRateMode", value)}
              />
            </div>
          )}
          {invoice.documentType === "QUOTATION_ESTIMATE" && (
            <button type="button" onClick={convertToInvoice} className="mt-4 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
              Convert to Invoice
            </button>
          )}
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className={headingClass}>My business profile</h2>
              <p className="mt-1 text-sm text-slate-500">Saved in this browser only. Your data is not uploaded.</p>
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
              Upload logo
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => uploadLogo(event.target.files?.[0])} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business / freelancer name" value={invoice.business.name} onChange={(value) => updateBusiness("name", value)} />
            <PhoneField label="Phone" value={invoice.business.phone} onChange={(value) => updateBusiness("phone", value)} />
            <Field label="Email" type="email" value={invoice.business.email} onChange={(value) => updateBusiness("email", value)} />
            <Field label="GSTIN / Tax ID" value={invoice.business.taxId} onChange={(value) => updateBusiness("taxId", value)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <TextArea label="Business address" value={invoice.business.address} onChange={(value) => updateBusiness("address", value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Account number" value={invoice.business.accountNumber} onChange={(value) => updateBusiness("accountNumber", value)} />
                <Field label="IFSC" value={invoice.business.ifsc} onChange={(value) => updateBusiness("ifsc", value)} />
              </div>
            </div>
            <div className="space-y-4">
              <Field label="UPI ID" value={invoice.business.upiId} onChange={(value) => updateBusiness("upiId", value)} placeholder="name@bank" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bank name" value={invoice.business.bankName} onChange={(value) => updateBusiness("bankName", value)} />
                <Field label="Account name" value={invoice.business.accountName} onChange={(value) => updateBusiness("accountName", value)} />
              </div>
              {invoice.persona === "FREELANCER" && <Field label="SWIFT / BIC" value={invoice.business.swift} onChange={(value) => updateBusiness("swift", value)} />}
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={`${headingClass} mb-4`}>Client details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" value={invoice.client.name} onChange={(value) => updateClient("name", value)} />
            <PhoneField label="Phone" value={invoice.client.phone} onChange={(value) => updateClient("phone", value)} />
            <Field label="Email" type="email" value={invoice.client.email} onChange={(value) => updateClient("email", value)} />
            <Field label="GSTIN / Tax ID" value={invoice.client.taxId} onChange={(value) => updateClient("taxId", value)} />
            <TextArea label="Client address" value={invoice.client.address} onChange={(value) => updateClient("address", value)} />
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={headingClass}>Line items</h2>
              <p className="mt-1 text-sm text-slate-500">Add services, products, materials, or labor costs.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {invoice.persona === "TRADESPERSON" ? (
                <>
                  <button type="button" onClick={() => addItem("MATERIAL")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Add material</button>
                  <button type="button" onClick={() => addItem("LABOR")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Add labor / service</button>
                </>
              ) : (
                <button type="button" onClick={() => addItem()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Add item</button>
              )}
              <button type="button" onClick={() => setItemsOpen((open) => !open)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50" aria-expanded={itemsOpen}>
                {itemsOpen ? "Hide items" : "Show items"}
              </button>
            </div>
          </div>
          {itemsOpen && (
            <div className="space-y-4">
              {invoice.items.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,2fr)_100px_90px_130px_100px_auto]">
                  <Field label="Description" value={item.description} onChange={(value) => updateItem(item.id, "description", value)} />
                  <Field label="HSN/SAC" value={item.hsnSac} onChange={(value) => updateItem(item.id, "hsnSac", value)} />
                  <Field label="Quantity" type="number" min={0} step={0.01} value={item.quantity} onChange={(value) => updateItem(item.id, "quantity", value)} />
                  <Field label="Unit rate" type="number" min={0} step={0.01} value={item.unitPrice} onChange={(value) => updateItem(item.id, "unitPrice", value)} />
                  <label className="block text-sm font-medium text-slate-700">
                    Unit
                    <select value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2">
                      {["Pcs", "Box", "Kg", "Mtr", "Hr", "Day", "Set", "Service"].map((unit) => <option key={unit}>{unit}</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.description || "item"}`} className="self-end rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
                </div>
              ))}
              {invoice.items.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No items yet. Add an item to prepare your document.</p>}
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className={`${headingClass} mb-4`}>Discount, tax & terms</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Discount type"
              value={invoice.discountType}
              options={[{ value: "PERCENT", label: "Percentage" }, { value: "FLAT", label: "Flat amount" }]}
              onChange={(value) => patchInvoice("discountType", value)}
            />
            <Field label={invoice.discountType === "PERCENT" ? "Discount (%)" : `Discount (${invoice.currency})`} type="number" min={0} step={0.01} value={invoice.discountValue} onChange={(value) => patchInvoice("discountValue", value === "" ? 0 : Number(value))} />
            <Select
              label="Tax type"
              value={invoice.taxType}
              options={[
                { value: "GST", label: "GST" },
                { value: "VAT", label: "VAT" },
                { value: "SALES_TAX", label: "Sales tax" },
                { value: "NONE", label: "No tax" },
              ]}
              onChange={(value) => patchInvoice("taxType", value)}
            />
            {invoice.taxType !== "NONE" && <Field label="Tax rate (%)" type="number" min={0} step={0.01} value={invoice.taxRate} onChange={(value) => patchInvoice("taxRate", value === "" ? 0 : Number(value))} />}
            {invoice.taxType === "GST" && (
              <Select<InvoiceGstMode>
                label="GST split"
                value={invoice.gstMode}
                options={[{ value: "CGST_SGST", label: "CGST + SGST" }, { value: "IGST", label: "IGST" }]}
                onChange={(value) => patchInvoice("gstMode", value)}
              />
            )}
            {invoice.persona === "TRADESPERSON" && <Field label={`Visiting charge (${invoice.currency})`} type="number" min={0} step={0.01} value={invoice.visitingCharge} onChange={(value) => patchInvoice("visitingCharge", value === "" ? 0 : Number(value))} />}
          </div>
          {invoice.persona === "TRADESPERSON" && (
            <div className="mt-4"><TextArea label="Warranty terms" value={invoice.warrantyTerms} onChange={(value) => patchInvoice("warrantyTerms", value)} /></div>
          )}
          {invoice.persona === "FREELANCER" && (
            <div className="mt-4 max-w-sm"><Field label="Payment due date" type="date" value={invoice.dueDate} onChange={(value) => patchInvoice("dueDate", value)} /></div>
          )}
          <div className="mt-4"><TextArea label="Notes / payment terms" value={invoice.notes} onChange={(value) => patchInvoice("notes", value)} /></div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={isWorking} onClick={() => void downloadPdf()} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {isWorking ? "Preparing…" : "Download PDF"}
          </button>
          <button type="button" disabled={isWorking} onClick={() => void shareDocument()} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
            Share via WhatsApp
          </button>
          <button type="button" disabled={isWorking} onClick={() => void printPdf()} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
            Print
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <ErrorAlert error={error ?? (totalsResult.message ? {
          title: "Invalid numeric values detected.",
          message: totalsResult.message,
          nextStep: errorMessages.numeric.nextStep,
        } : null)} />
        <InvoiceLivePreview invoice={invoice} totals={totalsResult.totals ?? { subtotal: 0, discountAmount: 0, taxableAmount: 0, taxAmount: 0, cgst: 0, sgst: 0, grandTotal: 0 }} qrDataUrl={qrDataUrl} />
      </div>
    </div>
  );
}
